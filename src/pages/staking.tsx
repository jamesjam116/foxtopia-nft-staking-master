import { getParsedNftAccountsByOwner } from "@nfteyez/sol-rayz";
import { useWallet } from "@solana/wallet-adapter-react";
import { NextSeo } from "next-seo";
import { useEffect, useState } from "react";
import { foxtopiaData, foxtopiaGenesisData } from "../../RarityMonData";
import CollectionBox from "../components/CollectionBox";
import DualCollectionBox from "../components/DualCollectionBox";
import DualStakedCollectionBox from "../components/DualStakedCollectionBox";
import HakuCollectionBox from "../components/HakuCollectionBox";
import Header from "../components/Header";
import StakedCollectionBox from "../components/StakedCollectionBox";
import { Copyright, CurrentReward, TotalBanner } from "../components/Widget";
import {
  FOXTOPIA_CREATOR_ADDRESS,
  FOXTOPIA_GENESIS_CREATOR_ADDRESS,
  HAKU_CREATOR_ADDRESS,
  LIVE_URL,
} from "../config";
import {
  calculateAllRewards,
  claimReward,
  getAllStakedNFTs,
  getGlobalInfo,
  getGlobalState,
  getUserDualPoolState,
  getUserPoolState,
} from "../contexts/transaction";
import { DualFetchedData, FOXIE_TOKEN_DECIMAL } from "../contexts/types";
import { solConnection } from "../contexts/utils";

export default function HomePage(props: {
  startLoading: Function;
  closeLoading: Function;
}) {
  const { startLoading, closeLoading } = props;
  const wallet = useWallet();
  const [hide, setHide] = useState(false);

  const [foxList, setFoxList] = useState<any>();
  const [foxGenesisList, setFoxGenesisList] = useState<any>();
  const [hakuList, setHakuList] = useState<any>();

  const [dualStakedNfts, setDualStakedNfts] = useState<DualFetchedData[]>();

  const [forceRender, setForceRender] = useState(false);
  const [totalStaked, setTotalStaked] = useState(0);
  const [liveRewards, setLiveReward] = useState(0);
  const [totalRewardDistributed, setTotalRewardDistributed] = useState(0);
  const [accumulatedReward, setAccumulatedReward] = useState(0);
  const [allNfts, setAllNfts] = useState<any>([]);
  const [claimAllLoading, setClaimAllLoading] = useState(false);

  const getNFTs = async () => {
    startLoading();
    if (wallet.publicKey !== null) {
      try {
        const walletNfts = await getParsedNftAccountsByOwner({
          publicAddress: wallet.publicKey.toBase58(),
          connection: solConnection,
        });
        let foxNfts: any[] = [];
        let foxGenesisNfts: any[] = [];
        let hakuNfts: any[] = [];

        const globalData = await getUserPoolState(wallet.publicKey);

        let stakedNfts: {
          mint: string;
          stakedTime: number;
          claimedTime: number;
          rate: number;
        }[] = [];

        if (globalData) {
          for (let i = 0; i < globalData.stakedCount.toNumber(); i++) {
            stakedNfts.push({
              mint: globalData.staking[i].mint.toBase58(),
              stakedTime: globalData.staking[i].stakedTime.toNumber(),
              claimedTime: globalData.staking[i].claimedTime.toNumber(),
              rate: globalData.staking[i].rate.toNumber(),
            });
          }
        }

        let dualUserData: DualFetchedData[] = [];
        const dual = await getUserDualPoolState(wallet.publicKey);

        if (dual) {
          const cnt = dual.stakedCount.toNumber();
          for (let i = 0; i < cnt; i++) {
            dualUserData.push({
              claimedTime: dual.staking[i].claimedTime.toNumber(),
              mintFox: dual.staking[i].mintFox.toBase58(),
              mintHaku: dual.staking[i].mintHaku.toBase58(),
              rate: dual.staking[i].rate.toNumber(),
              stakedTime: dual.staking[i].stakedTime.toNumber(),
            });
          }
        }

        setDualStakedNfts(dualUserData);

        if (walletNfts.length !== 0) {
          for (let item of walletNfts) {
            if (item.data.creators) {
              if (item.data?.creators[0].address === FOXTOPIA_CREATOR_ADDRESS) {
                let rank = 6900;
                const result = foxtopiaData.find(
                  ({ title }) => title === item.data.name
                );

                if (result) {
                  rank = result.rank;
                }
                const stakedData = stakedNfts.find(
                  (nft) => nft.mint === item.mint
                );
                const dualed = dualUserData.find(
                  (dual) => dual.mintFox === item.mint
                );
                if (!dualed) {
                  foxNfts.push({
                    ...item,
                    staked: stakedData ? true : false,
                    selected: false,
                    rank: rank,
                    rate: stakedData
                      ? stakedData.rate / FOXIE_TOKEN_DECIMAL
                      : 0,
                    stakedTime: stakedData
                      ? stakedData.stakedTime
                      : new Date().getDate() / 1000,
                    claimedTime: stakedData
                      ? stakedData.claimedTime
                      : new Date().getDate() / 1000,
                  });
                }
              } else if (
                item.data?.creators[0].address ===
                FOXTOPIA_GENESIS_CREATOR_ADDRESS
              ) {
                const stakedData = stakedNfts.find(
                  (nft) => nft.mint === item.mint
                );
                let rank = 6000;
                const result = foxtopiaGenesisData.find(
                  ({ title }) => title === item.data.name
                );

                if (result) {
                  rank = result.rank;
                }

                foxGenesisNfts.push({
                  ...item,
                  staked: stakedData ? true : false,
                  selected: false,
                  rank: rank,
                  rate: stakedData ? stakedData.rate / FOXIE_TOKEN_DECIMAL : 0,
                  stakedTime: stakedData
                    ? stakedData.stakedTime
                    : new Date().getDate() / 1000,
                  claimedTime: stakedData
                    ? stakedData.claimedTime
                    : new Date().getDate() / 1000,
                });
              } else if (
                item.data?.creators[0].address === HAKU_CREATOR_ADDRESS
              ) {
                const stakedData = stakedNfts.find(
                  (nft) => nft.mint === item.mint
                );

                const dualed = dualUserData.find(
                  (dual) => dual.mintHaku === item.mint
                );
                if (!dualed) {
                  hakuNfts.push({
                    ...item,
                    staked: stakedData ? true : false,
                    selected: false,
                    rate: stakedData
                      ? stakedData.rate / FOXIE_TOKEN_DECIMAL
                      : 0,
                    stakedTime: stakedData
                      ? stakedData.stakedTime
                      : new Date().getDate() / 1000,
                    claimedTime: stakedData
                      ? stakedData.claimedTime
                      : new Date().getDate() / 1000,
                  });
                }
              }
            }
          }
        }

        setFoxList(foxNfts);
        setFoxGenesisList(foxGenesisNfts);
        setHakuList(hakuNfts);

        let allNfts = foxNfts.concat(foxGenesisNfts).concat(hakuNfts);
        console.log(allNfts);
        setAllNfts(allNfts);
        setHide(!hide);
        closeLoading();
      } catch (error) {
        console.log(error);
        closeLoading();
      }
    }
  };

  const [updated, setUpdated] = useState(false);

  const updatePage = async () => {
    setAllNfts([]);
    setFoxList([]);
    setHakuList([]);
    setFoxGenesisList([]);
    await getNFTs();
    setForceRender(!forceRender);
  };

  const getGlobalData = async () => {
    if (wallet.publicKey === null) return;
    setUpdated(!updated);
    const data = await getGlobalInfo();
    const global = await getGlobalState();
    const reward = await calculateAllRewards(wallet);
    const userData = await getAllStakedNFTs(solConnection);

    if (userData.count !== 0 && userData.data) {
      for (let item of userData.data) {
        if (item.owner === wallet.publicKey.toBase58()) {
          setAccumulatedReward(item.accumulatedReward / FOXIE_TOKEN_DECIMAL);
        }
      }
    }
    if (data) setTotalStaked(data.totalStakedCount);
    setLiveReward(reward / FOXIE_TOKEN_DECIMAL);
    if (global) {
      setTotalRewardDistributed(
        global.totalRewardDistributed.toNumber() / FOXIE_TOKEN_DECIMAL
      );
    }
  };

  const handleClaimReward = async () => {
    await claimReward(
      wallet,
      () => setClaimAllLoading(true),
      () => setClaimAllLoading(false),
      () => getGlobalData()
    );
  };

  useEffect(() => {
    if (wallet.publicKey !== null) {
      getNFTs();
      getGlobalData();
    } else {
      setAllNfts([]);
      setFoxList([]);
      setFoxGenesisList([]);
    }
    // eslint-disable-next-line
  }, [wallet.connected, wallet.publicKey]);

  return (
    <>
      <NextSeo
        title="Foxtopia | NFT Staking"
        description="Earn $Foxie when you stake with us! Be part of our Foxtopia community and earn rewards to use both in & out of game"
        openGraph={{
          url: `${LIVE_URL}`,
          title: "Foxtopia | NFT Staking",
          description:
            "Earn $Foxie when you stake with us! Be part of our Foxtopia community and earn rewards to use both in & out of game",
          images: [
            {
              url: `${LIVE_URL}og-cover.jpg`,
              width: 947,
              height: 540,
              alt: "Foxtopia",
              type: "image/jpeg",
            },
          ],
          site_name: "Foxtopia",
        }}
      />
      <Header />
      <main>
        <div className="container">
          <TotalBanner
            supply={7500}
            totalStaked={totalStaked}
            rewardsDistribued={totalRewardDistributed}
            updated={updated}
          />
          <CurrentReward
            liveRewards={liveRewards}
            accumlatedRewards={accumulatedReward}
            handleAllReward={() => handleClaimReward()}
            claimLoaidng={claimAllLoading}
          />
          {/* Foxtopia Genesis Collection */}
          <CollectionBox
            title="Foxtopia Genesis Collection"
            nfts={foxGenesisList}
            startLoading={startLoading}
            closeLoading={closeLoading}
            updatePage={() => updatePage()}
            forceRender={forceRender}
            handleClaimReward={handleClaimReward}
          />
          {/* Foxtopia Collection */}
          <CollectionBox
            title="Foxtopia Collection"
            nfts={foxList}
            startLoading={startLoading}
            closeLoading={closeLoading}
            updatePage={() => updatePage()}
            forceRender={forceRender}
            handleClaimReward={handleClaimReward}
          />
          <CollectionBox
            title="Haku"
            nfts={hakuList}
            startLoading={startLoading}
            closeLoading={closeLoading}
            updatePage={() => updatePage()}
            forceRender={forceRender}
            handleClaimReward={handleClaimReward}
          />

          <DualCollectionBox
            nfts={allNfts}
            startLoading={startLoading}
            closeLoading={closeLoading}
            updatePage={() => updatePage()}
            forceRender={forceRender}
            handleClaimReward={handleClaimReward}
          />

          <StakedCollectionBox
            nfts={allNfts}
            startLoading={startLoading}
            closeLoading={closeLoading}
            updatePage={() => updatePage()}
            forceRender={forceRender}
            handleClaimReward={handleClaimReward}
          />
          {dualStakedNfts && (
            <DualStakedCollectionBox
              nfts={dualStakedNfts}
              wallet={wallet}
              startLoading={() => startLoading()}
              closeLoading={() => closeLoading()}
              updatePage={() => updatePage()}
              forceRender={forceRender}
            />
          )}
        </div>
        <Copyright />
      </main>
    </>
  );
}
