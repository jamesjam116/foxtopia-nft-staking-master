import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { stakeNFT } from "../contexts/transaction";
import NFTCard from "./NFTCard";
import { errorAlert } from "./toastGroup";
import { Button } from "./Widget";

export default function CollectionDualBox(props: {
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
  const router = useRouter();

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
        () => startLoading(),
        () => closeLoading(),
        () => forceReload()
      );
    } catch (error) {
      console.log(error);
    }
  };

  const handleAllStake = async () => {
    if (wallet.publicKey === null) return;
    let nfts: any = [];
    if (props.nfts.length !== 0) {
      for (let item of props.nfts) {
        if (!item.staked) {
          nfts.push(item);
        }
      }
    }
    console.log(nfts, "====> nfts");
    try {
      await stakeNFT(
        wallet,
        nfts,
        () => startLoading(),
        () => closeLoading(),
        () => forceReload()
      );
    } catch (error) {
      console.log(error);
    }
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
            <Button variant="secondary" onClick={handleStake}>
              STAKE
            </Button>
            <Button onClick={handleAllStake} variant="secondary">
              STAKE ALL
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
