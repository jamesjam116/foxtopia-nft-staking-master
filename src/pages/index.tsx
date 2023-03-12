import { useWallet } from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import { NextSeo } from "next-seo";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { LIVE_URL } from "../config";
import {
  getAllNFTs,
  getGlobalInfo,
  getGlobalState,
} from "../contexts/transaction";
import { FOXIE_TOKEN_DECIMAL } from "../contexts/types";

export default function HomePage() {
  const router = useRouter();
  const wallet = useWallet();
  const [totalStaked, setTotalStaked] = useState(0);
  const [totalRewardDistributed, setTotalRewardDistributed] = useState(0);

  const getGlobalData = async () => {
    const data = await getGlobalInfo();
    const global = await getGlobalState();
    const userData = await getAllNFTs();

    if (data && global && userData.data?.length !== 0) {
      setTotalStaked(data.totalStakedCount);
      setTotalRewardDistributed(
        global.totalRewardDistributed.toNumber() / FOXIE_TOKEN_DECIMAL
      );
    }
    setInterval(async () => {
      const data = await getGlobalInfo();
      const global = await getGlobalState();
      const userData = await getAllNFTs();

      if (data && global && userData.data?.length !== 0) {
        setTotalStaked(data.totalStakedCount);
        setTotalRewardDistributed(
          global.totalRewardDistributed.toNumber() / FOXIE_TOKEN_DECIMAL
        );
      }
    }, 60000);
  };
  useEffect(() => {
    getGlobalData();
  }, []);

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
      <div className="landing-page">
        <div className="landing-content">
          <div className="content">
            <div className="sub-content">
              {/* eslint-diable-next-line */}
              <div className="image-content">
                <div className="main-content">
                  {/* eslint-disable-next-line */}
                  <img src="/img/logo.png" alt="" className="landing-logo" />
                  <div className="total-values-intro">
                    <div className="total-intro-items">
                      <p>Total Staked</p>
                      <h4>{(totalStaked / 75).toFixed(3)}%</h4>
                    </div>
                    <div className="total-intro-items">
                      <p>Rewards Distributed</p>
                      <h4>{totalRewardDistributed.toLocaleString()} $Foxie</h4>
                    </div>
                  </div>
                  <div className="intro-box">
                    <h1>Earn rewards when you stake with us!</h1>
                    <div className="div-p">
                      {/* <span></span> */}
                      <p>Be part of our Foxtopia community and earn tokens</p>
                    </div>
                    <div className="connect-wallet">
                      {wallet.publicKey === null ? (
                        <WalletModalProvider>
                          <WalletMultiButton />
                        </WalletModalProvider>
                      ) : (
                        <button
                          className="goto-staking"
                          onClick={() => router.push("/staking")}
                        >
                          Go to Staking
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                {/* eslint-disable-next-line */}
                <img
                  src="/img/landing-banner.png"
                  className="landing-image"
                  alt=""
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
