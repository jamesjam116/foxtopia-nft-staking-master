// eslint-disable-next-line
import { useWallet, WalletContextState } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import {
  claimDualReward,
  claimReward,
  withdrawDualNft,
  withdrawNft,
} from "../contexts/transaction";
import { Button } from "./Widget";
import { HashLoader } from "react-spinners";
import { DualFetchedData } from "../contexts/types";
import DualStakedCard from "./DualStakedCard";
import { PublicKey } from "@solana/web3.js";

export default function DualStakedCollectionBox(props: {
  nfts: DualFetchedData[];
  wallet: WalletContextState;
  startLoading: Function;
  closeLoading: Function;
  updatePage: Function;
  forceRender: boolean;
}) {
  const wallet = useWallet();
  const { startLoading, closeLoading, updatePage } = props;
  const [selectedNfts, setSelectedNfts] = useState(props.nfts);
  const [unstakedAllLoading, setUnstakeAllLoading] = useState(false);
  const [claimAllLoading, setClaimAllLoading] = useState(false);

  const handleUnStake = async () => {
    let items: {
      hakuMint: PublicKey;
      foxMint: PublicKey;
    }[] = [];

    for (let item of props.nfts) {
      items.push({
        hakuMint: new PublicKey(item.mintHaku),
        foxMint: new PublicKey(item.mintFox),
      });
    }
    try {
      await withdrawDualNft(
        wallet,
        items,
        () => setUnstakeAllLoading(true),
        () => setUnstakeAllLoading(false),
        () => props.updatePage()
      );
    } catch (error) {
      console.log(error);
    }
  };

  const handleClaimReward = async () => {
    try {
      await claimDualReward(
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
            <div className="content">DUAL STAKED NFT</div>
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
        <div className="dual-staked-box-content">
          {props.nfts.map((item, key) => (
            <DualStakedCard
              key={key}
              haku={item.mintHaku}
              foxtopia={item.mintFox}
              stakedTime={item.stakedTime}
              rarity={item.rate}
              wallet={props.wallet}
              updatePage={() => props.updatePage()}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
