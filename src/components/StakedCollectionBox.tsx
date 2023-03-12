// eslint-disable-next-line
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";
import { claimReward, withdrawNft } from "../contexts/transaction";
import StakedCard from "./StakedCard";
import { errorAlert } from "./toastGroup";
import { Button } from "./Widget";
import { HashLoader } from "react-spinners";
import { useRouter } from "next/router";

export default function StakedCollectionBox(props: {
  title?: string;
  nfts?: any;
  onStake?: Function;
  onUnstake?: Function;
  onClaim?: Function;
  startLoading: Function;
  closeLoading: Function;
  updatePage: Function;
  forceRender: boolean;
  handleClaimReward: Function;
}) {
  const wallet = useWallet();
  const { startLoading, closeLoading, updatePage } = props;
  const [selectedNfts, setSelectedNfts] = useState(props.nfts);
  const [unstakedAllLoading, setUnstakeAllLoading] = useState(false);
  const [claimAllLoading, setClaimAllLoading] = useState(false);

  const handleSelect = (nftMintAddress: string, selected: boolean) => {
    if (props.nfts && props.nfts.length !== 0) {
      let list: any = selectedNfts;
      if (list && list.length !== 0) {
        for (let i = 0; i < list.length; i++) {
          if (list[i].mint === nftMintAddress) {
            list[i].selected = selected;
          }
        }
      }
      setSelectedNfts(list);
    }
  };

  const router = useRouter();

  const forceReload = () => {
    updatePage();
    router.reload();
  };
  const handleUnStake = async () => {
    if (wallet.publicKey === null) return;
    let nfts: any = [];
    for (let item of selectedNfts) {
      if (item.staked) {
        nfts.push({
          mint: new PublicKey(item.mint),
        });
      }
    }
    if (nfts.length === 0) {
      errorAlert("Please select NFT!");
      return;
    }
    console.log(nfts, "===> nfts");
    try {
      await withdrawNft(
        wallet,
        nfts,
        () => setUnstakeAllLoading(true),
        () => setUnstakeAllLoading(false),
        () => forceReload()
      );
    } catch (error) {
      console.log(error);
    }
  };

  const handleClaimReward = async () => {
    try {
      await claimReward(
        wallet,
        () => setClaimAllLoading(true),
        () => setClaimAllLoading(false),
        () => props.updatePage()
      );
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    setSelectedNfts(props.nfts);
  }, [props.nfts]);

  return (
    <div className="collection-box staked-collectionbox">
      <div className="box-body">
        <div className="box-header">
          <div className="box-title">
            <div className="content">SINGLE STAKED NFT</div>
          </div>
          <div className="button-group">
            <Button variant="secondary" onClick={handleUnStake}>
              {!unstakedAllLoading ? (
                <span>UNSTAKE ALL</span>
              ) : (
                <>
                  <HashLoader size={18} color="#f900ef" />
                  <span style={{ color: "#f900ef", fontWeight: "bold" }}>
                    &nbsp;&nbsp;UNSTAKING...
                  </span>
                </>
              )}
            </Button>
            <Button onClick={handleClaimReward} variant="secondary">
              {!claimAllLoading ? (
                <span>CLAIM ALL</span>
              ) : (
                <>
                  <HashLoader size={18} color="#f900ef" />
                  <span style={{ color: "#f900ef", fontWeight: "bold" }}>
                    &nbsp;&nbsp;CLAIMING...
                  </span>
                </>
              )}
            </Button>
          </div>
        </div>
        <div className="box-content">
          {props.nfts &&
            props.nfts.length !== 0 &&
            props.nfts.map(
              (item: any, key: number) =>
                item.staked && (
                  <StakedCard
                    mint={item.mint}
                    staked={item.staked}
                    selected={item.selected}
                    stakedTime={item.stakedTime}
                    key={key}
                    handleSelect={handleSelect}
                    forceRender={props.forceRender}
                    wallet={wallet}
                    startLoading={() => props.startLoading()}
                    closeLoading={() => props.closeLoading()}
                    updatePage={() => props.updatePage()}
                  />
                )
            )}
        </div>
      </div>
    </div>
  );
}
