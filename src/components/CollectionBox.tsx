import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { HashLoader } from "react-spinners";
import { stakeNFT } from "../contexts/transaction";
import NFTCard from "./NFTCard";
import { errorAlert } from "./toastGroup";
import { Button } from "./Widget";
import { useRouter } from "next/router";

export default function CollectionBox(props: {
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
  const [forceRender, setForceRender] = useState(false);

  const router = useRouter();

  const [stakeLoading, setStakeLoading] = useState(false);
  const [stakeAllLoading, setStakeAllLoading] = useState(false);

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

  const forceReload = () => {
    updatePage();
    router.reload();
  };

  const handleStake = async () => {
    if (wallet.publicKey === null) return;
    let nfts: any = [];
    console.log(nfts);
    for (let item of selectedNfts) {
      if (item.selected) {
        nfts.push({
          mint: new PublicKey(item.mint),
          rarity: item.rank,
        });
      }
    }
    if (nfts.length === 0) {
      errorAlert("Please select NFT!");
      return;
    }
    console.log(nfts, "===> selectedNfts");
    try {
      await stakeNFT(
        wallet,
        nfts,
        () => setStakeLoading(true),
        () => setStakeLoading(false),
        () => forceReload()
      );
    } catch (error) {
      console.log(error);
    }
    setForceRender(!forceRender);
  };

  const handleAllStake = async () => {
    if (wallet.publicKey === null) return;
    let nfts: any = [];
    if (props.nfts.length !== 0) {
      for (let item of props.nfts) {
        nfts.push({
          mint: new PublicKey(item.mint),
          rarity: item.rank,
        });
      }
    }
    console.log(nfts, "====> nfts");
    try {
      await stakeNFT(
        wallet,
        nfts,
        () => setStakeAllLoading(true),
        () => setStakeAllLoading(false),
        () => forceReload()
      );
    } catch (error) {
      console.log(error);
    }
    setForceRender(!forceRender);
  };

  useEffect(() => {
    setSelectedNfts(props.nfts);
    // eslint-disable-next-line
  }, [props.nfts]);

  return (
    <div className="collection-box">
      <div className="box-body">
        <div className="box-header">
          <h3 className="title">{props.title && props.title}</h3>
          <div className="button-group">
            <Button
              variant="secondary"
              onClick={handleStake}
              disabled={stakeLoading}
            >
              {!stakeLoading ? (
                <span>STAKE</span>
              ) : (
                <>
                  <HashLoader size={18} color="#f900ef" />
                  <span style={{ color: "#f900ef", fontWeight: "bold" }}>
                    &nbsp;&nbsp;Staking...
                  </span>
                </>
              )}
            </Button>
            <Button
              onClick={handleAllStake}
              variant="secondary"
              disabled={stakeAllLoading}
            >
              {!stakeAllLoading ? (
                <span>STAKE ALL</span>
              ) : (
                <>
                  <HashLoader size={18} color="#f900ef" />
                  <span style={{ color: "#f900ef", fontWeight: "bold" }}>
                    &nbsp;&nbsp;Staking...
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
                !item.staked && (
                  <NFTCard
                    mint={item.mint}
                    staked={item.staked}
                    selected={item.selected}
                    rank={item.rank}
                    key={key}
                    handleSelect={handleSelect}
                    forceRender={props.forceRender}
                  />
                )
            )}
        </div>
      </div>
    </div>
  );
}
