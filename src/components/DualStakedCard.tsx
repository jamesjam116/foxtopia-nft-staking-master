import { useState, useEffect } from "react";
import moment from "moment";
import { FOXIE_TOKEN_DECIMAL, PageNftType } from "../contexts/types";
import { HashLoader } from "react-spinners";
import { Button } from "./Widget";
import { getNftMetaData } from "../contexts/utils";
import { PublicKey } from "@solana/web3.js";
import { claimDualReward, withdrawDualNft } from "../contexts/transaction";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { useRouter } from "next/router";

export default function DualStakedCard(props: {
  haku: string;
  foxtopia: string;
  stakedTime: number;
  rarity: number;
  wallet: WalletContextState;
  updatePage: Function;
}) {
  const { haku, foxtopia, stakedTime, updatePage } = props;
  const [unstakeLoading, setUnstakeLoading] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [hakuImage, setHakuImage] = useState("");
  const [foxImage, setFoxImage] = useState("");
  const router = useRouter();
  const forceReload = () => {
    updatePage();
    router.reload();
  };
  const handleUnstakeOne = async () => {
    try {
      await withdrawDualNft(
        props.wallet,
        [
          {
            hakuMint: new PublicKey(haku),
            foxMint: new PublicKey(foxtopia),
          },
        ],
        () => setUnstakeLoading(true),
        () => setUnstakeLoading(false),
        () => forceReload()
      );
    } catch (error) {}
  };

  const handleClaimReward = async () => {
    try {
      await claimDualReward(
        props.wallet,
        () => setClaimLoading(true),
        () => setClaimLoading(false),
        () => forceReload(),
        new PublicKey(haku),
        new PublicKey(foxtopia)
      );
    } catch (error) {
      console.log(error);
    }
  };

  const getNftDetail = async () => {
    setIsLoading(true);
    const hakuUri = await getNftMetaData(new PublicKey(props.haku));
    const foxtopiaUri = await getNftMetaData(new PublicKey(props.foxtopia));
    await fetch(hakuUri)
      .then((resp) => resp.json())
      .then((json) => {
        setHakuImage(json.image);
      })
      .catch((error) => {
        console.log(error);
      });
    await fetch(foxtopiaUri)
      .then((resp) => resp.json())
      .then((json) => {
        setFoxImage(json.image);
      })
      .catch((error) => {
        console.log(error);
      });
    setIsLoading(false);
  };

  useEffect(() => {
    getNftDetail();
    // eslint-disable-next-line
  }, [props.stakedTime]);

  return (
    <div className="dual-staked-card">
      <div className="dual-medias">
        {/* eslint-disable-next-line */}
        <img src={hakuImage} alt="" />
        {/* eslint-disable-next-line */}
        <img src={foxImage} alt="" />
      </div>
      <div className="dual-staked-content">
        <p>Staked: {moment(stakedTime * 1000).format("YYYY-MM-DD")}</p>
        <h5>{props.rarity / FOXIE_TOKEN_DECIMAL} $Foxie / day</h5>

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
  );
}
