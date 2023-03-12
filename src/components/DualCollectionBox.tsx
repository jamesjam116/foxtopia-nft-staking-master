// eslint-disable-next-line
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";
import { stakeDualNFT } from "../contexts/transaction";
import DualAbleCard from "./DualAbleCard";
import { DualPlusIcon } from "./svgIcons";
import { Button } from "./Widget";
import { HashLoader } from "react-spinners";
import { PageNftType } from "../contexts/types";
import { useRouter } from "next/router";

export default function DualCollectionBox(props: {
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
  const { updatePage } = props;
  const [haku, setHaku] = useState<PageNftType>();
  const [foxtopia, setFoxtopia] = useState<PageNftType>();
  const [stakingLoading, setStakeLoading] = useState(false);

  const router = useRouter();
  const update = () => {
    updatePage();
    setHaku(undefined);
    setFoxtopia(undefined);
    router.reload();
  };

  const [previewReward, setPreviewReward] = useState(0);

  const handleDualStaking = async () => {
    if (haku && foxtopia) {
      try {
        await stakeDualNFT(
          wallet,
          new PublicKey(haku.mint),
          new PublicKey(foxtopia.mint),
          foxtopia.rank,
          () => setStakeLoading(true),
          () => setStakeLoading(false),
          () => update()
        );
      } catch (error) {
        console.log(error);
      }
    }
  };

  useEffect(() => {
    if (foxtopia && haku) {
      let rarity = 5;
      // 1 ~ 2000 : 10
      // 2001 ~ 4000 : 7.5
      // 4001 : 5
      if (foxtopia.rank < 2001) {
        rarity = 10;
      } else if (foxtopia.rank < 4001) {
        rarity = 7.5;
      } else {
        rarity = 5;
      }
      setPreviewReward((rarity + 10) * 1.5);
      // console.log(rate, "===> preview rate");
    }
    // eslint-disable-next-line
  }, [JSON.stringify(foxtopia), JSON.stringify(haku)]);

  return (
    <div className="collection-box staked-collectionbox">
      <div className="box-body">
        <div className="box-header">
          <div className="box-title">
            <div className="content">DUAL STAKE</div>
          </div>
          <div className="button-group">
            <Button
              onClick={handleDualStaking}
              variant="secondary"
              disabled={
                stakingLoading || (haku === undefined && foxtopia === undefined)
              }
            >
              {!stakingLoading ? (
                <span>STAKE</span>
              ) : (
                <>
                  <HashLoader size={18} color="#f900ef" />
                  <span style={{ color: "#f900ef", fontWeight: "bold" }}>
                    &nbsp;&nbsp;STAKING...
                  </span>
                </>
              )}
            </Button>
          </div>
        </div>
        <div className="dual-box">
          <div className="dual-box-content">
            <div className="dual-item">
              <DualAbleCard nfts={props.nfts} isHaku setNft={setHaku} />
            </div>
            <span className="nft-plus">
              <DualPlusIcon />
            </span>
            <div className="dual-item">
              <DualAbleCard nfts={props.nfts} setNft={setFoxtopia} />
            </div>
          </div>
          <div className="preview-staking">
            <h4>REWARDS</h4>
            {foxtopia && haku ? (
              <p>{previewReward} $Foxie/day</p>
            ) : (
              <p>-- $Foxie/day</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
