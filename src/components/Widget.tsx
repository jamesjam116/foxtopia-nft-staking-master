import { styled } from "@mui/material/styles";
import Tooltip, { TooltipProps, tooltipClasses } from "@mui/material/Tooltip";
import Fade from "@mui/material/Fade";
import {
  getAllNFTs,
  getGlobalInfo,
  getGlobalState,
} from "../contexts/transaction";
import { useEffect, useState } from "react";
import { HashLoader } from "react-spinners";
import { FOXIE_TOKEN_DECIMAL } from "../contexts/types";

export function TotalBanner(props: {
  supply: number;
  totalStaked: number;
  rewardsDistribued: number;
  updated: boolean;
}) {
  const [totalStaked, setTotalStaked] = useState(0);
  const [totalRewardDistributed, setTotalRewardDistributed] = useState(0);

  const getGlobalData = async () => {
    setTotalStaked(0);
    setTotalRewardDistributed(0);
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
    }, 10000);
  };
  useEffect(() => {
    getGlobalData();
  }, [props.updated]);

  return (
    <div className="total-banner">
      <div className="gradient-border item">
        <div className="item-content">
          <label>Supply</label>
          <p>{props.supply}</p>
        </div>
      </div>
      <div className="gradient-border item">
        <div className="item-content">
          <label>Total Staked</label>
          <p>{((totalStaked + 600) / 75).toLocaleString()}%</p>
        </div>
      </div>
      <div className="gradient-border item">
        <div className="item-content">
          <label>Rewards Distributed</label>
          <p>{totalRewardDistributed.toLocaleString()} $Foxie</p>
        </div>
      </div>
    </div>
  );
}

export function CurrentReward(props: {
  liveRewards: number;
  accumlatedRewards: number;
  handleAllReward: Function;
  claimLoaidng: boolean;
}) {
  return (
    <div className="current-reward">
      <h3>Your current rewards</h3>
      <div className="content">
        <div className="item with-button">
          <div className="item-content">
            <div className="text-content">
              <label>Live Rewards</label>
              <p>+{props.liveRewards.toLocaleString()} $Foxie</p>
            </div>
            <button
              className="btn-claim-all claim-all"
              onClick={() => props.handleAllReward()}
              disabled={props.claimLoaidng}
            >
              {props.claimLoaidng ? (
                <div className="content loading-content">
                  <HashLoader size={18} color="#f900ef" />
                  <span
                    style={{
                      color: "#f900ef",
                      fontSize: 20,
                      fontWeight: "bold",
                    }}
                  >
                    &nbsp;&nbsp;Claiming...
                  </span>
                </div>
              ) : (
                <div className="content">Claim all rewards</div>
              )}
            </button>
          </div>
        </div>
        <div className="item">
          <div className="item-content">
            <label>Accumulated Rewards</label>
            <p>{props.accumlatedRewards.toLocaleString()} $Foxie</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export const Button = (props: {
  title?: string;
  children: any;
  style?: any;
  className?: string;
  onClick: Function;
  variant?: "primary" | "secondary";
  disabled?: boolean;
}) => {
  return (
    <button
      className={`${props.variant === "primary" && "btn-primary"} ${
        props.variant === "secondary" && "btn-secondary"
      } ${props.className}`}
      style={props.style}
      disabled={props.disabled}
      onClick={() => props.onClick()}
    >
      <div className="content">{props.children}</div>
    </button>
  );
};

export const Copyright = () => {
  return (
    <footer className="container">
      <div className="copyright">
        <p>copyright © 2022 www.foxtopia.io</p>
      </div>
    </footer>
  );
};

export const LightTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip
    {...props}
    classes={{ popper: className }}
    TransitionComponent={Fade}
    followCursor
  />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    background: "linear-gradient(80deg, #004af9 0%, #db00ff 100%)",
    color: "#fff",
    boxShadow: "#333",
    fontSize: 12,
  },
}));
