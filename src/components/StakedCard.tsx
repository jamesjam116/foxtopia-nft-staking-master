import { Skeleton } from "@mui/material";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import moment from "moment";
import { useEffect, useState } from "react";
import { HashLoader } from "react-spinners";
import {
  calculateReward,
  claimReward,
  getUserPoolState,
  withdrawNft,
} from "../contexts/transaction";
import { FOXIE_TOKEN_DECIMAL } from "../contexts/types";
import { getNftMetaData } from "../contexts/utils";
import { Button } from "./Widget";

export default function StakedCard(props: {
  mint: string;
  staked: boolean;
  selected: boolean;
  handleSelect: Function;
  forceRender: boolean;
  stakedTime: number;
  wallet: WalletContextState;
  startLoading: Function;
  closeLoading: Function;
  updatePage: Function;
}) {
  const [image, setImage] = useState("");
  const [selected, setSelected] = useState(false);
  const [reward, setReward] = useState(0);
  const [rate, setRate] = useState<number | undefined>();

  const [unstakeLoading, setUnstakeLoaing] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);

  const getNFTdetail = async () => {
    const uri = await getNftMetaData(new PublicKey(props.mint));
    await fetch(uri)
      .then((resp) => resp.json())
      .then((json) => {
        setImage(json.image);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const getReward = async () => {
    setReward(0);
    const rewardChain = await calculateReward(
      props.wallet,
      new PublicKey(props.mint)
    );
    if (props.wallet.publicKey !== null) {
      const userData = await getUserPoolState(props.wallet.publicKey);
      if (userData) {
        for (let item of userData?.staking) {
          if (item.mint.toBase58() === props.mint) {
            setRate(item.rate?.toNumber());
          }
        }
      }
    }
    setReward(rewardChain);
    setInterval(async () => {
      const rewardChain = await calculateReward(
        props.wallet,
        new PublicKey(props.mint)
      );
      if (props.wallet.publicKey !== null) {
        const userData = await getUserPoolState(props.wallet.publicKey);
        if (userData) {
          for (let item of userData?.staking) {
            if (item.mint.toBase58() === props.mint) {
              setRate(item.rate?.toNumber());
            }
          }
        }
      }
      setReward(rewardChain);
    }, 10000);
  };

  const handleUnstakeOne = async () => {
    try {
      await withdrawNft(
        props.wallet,
        [{ mint: new PublicKey(props.mint) }],
        () => setUnstakeLoaing(true),
        () => setUnstakeLoaing(false),
        () => props.updatePage()
      );
    } catch (error) {
      console.log(error);
    }
  };

  const handleClaimReward = async () => {
    try {
      await claimReward(
        props.wallet,
        () => setClaimLoading(true),
        () => setClaimLoading(false),
        () => props.updatePage(),
        new PublicKey(props.mint)
      );
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    setSelected(props.selected);
    getNFTdetail();
    getReward();
    // eslint-disable-next-line
  }, [props.mint, props.forceRender, props.stakedTime]);

  return (
    <div
      className={`nft-card ${selected && "selected"} staked`}
      style={{ minHeight: 280, cursor: "default" }}
    >
      <div className="nft-card-content">
        <div className="media">
          {image ? (
            // eslint-disable-next-line
            <img src={image} alt="" />
          ) : (
            <Skeleton
              variant="rectangular"
              width={139}
              height={158}
              sx={{ backgroundColor: "#fffefe15" }}
              style={{ borderRadius: 15 }}
              animation="wave"
            />
          )}
          <div className="card-content">
            <p className="staked-text">
              Staked: {moment(props.stakedTime * 1000).format("YYYY-MM-DD")}
            </p>
            <p className="staked-text">
              {rate && rate / FOXIE_TOKEN_DECIMAL} $Foxie
            </p>
            <p className="staked-text">~{reward.toLocaleString()} $Foxie</p>
            <div className="staked-card-action">
              <Button
                className="btn-third"
                onClick={handleUnstakeOne}
                disabled={unstakeLoading}
              >
                {!unstakeLoading ? (
                  <span>UNSTAKE</span>
                ) : (
                  <>
                    <HashLoader size={12} color="#f900ef" />
                  </>
                )}
              </Button>
              <Button
                className="btn-third"
                onClick={handleClaimReward}
                disabled={claimLoading}
              >
                {!claimLoading ? (
                  <span>CLAIM</span>
                ) : (
                  <>
                    <HashLoader size={12} color="#f900ef" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
