import { Dialog, useMediaQuery, useTheme } from "@mui/material";
import { useState, useEffect } from "react";
import { PageNftType } from "../contexts/types";
import DialogNftCard from "./DialogNftCard";

export default function NftSelectDialog(props: {
  nfts: PageNftType[];
  open: boolean;
  fetchLoading: boolean;
  onClose: Function;
  current: PageNftType | undefined;
  setCard: Function;
  isHaku?: boolean;
}) {
  const { open, onClose, nfts } = props;
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));
  const [hakuNfts, setHakuNfts] = useState<PageNftType[]>([]);
  const [foxtopiaNfts, setFoxtopiaNfts] = useState<PageNftType[]>([]);

  const handleClose = () => {
    console.log(open, "clicked!");
    onClose();
  };

  const onSplitNfts = () => {
    let hakus: PageNftType[] = [];
    let foxtopias: PageNftType[] = [];
    console.log(nfts);
    if (nfts.length !== 0) {
      for (let item of nfts) {
        if (!item.staked) {
          if (item.data?.name.toLowerCase().indexOf("haku") !== -1) {
            hakus.push(item);
          } else if (
            item.data?.name.toLowerCase().indexOf("fox") !== -1 &&
            item.data?.symbol !== ""
          ) {
            foxtopias.push(item);
          }
        }
      }
    }
    setHakuNfts(hakus);
    setFoxtopiaNfts(foxtopias);
  };

  useEffect(() => {
    onSplitNfts();
    // eslint-disable-next-line
  }, [JSON.stringify(nfts)]);

  useEffect(() => {
    onClose();
    // eslint-disable-next-line
  }, [props.current]);
  return (
    <Dialog fullScreen={fullScreen} open={open} onClose={() => handleClose()}>
      <h2 className="modaltitle">
        Select {props.isHaku ? " Haku " : " Foxtopia "} NFT
      </h2>
      {props.isHaku ? (
        <>
          {props.fetchLoading ? (
            <h1>Loading...</h1>
          ) : (
            <div className="dialog-listed-box custom-scrollbar">
              {hakuNfts.length !== 0 &&
                hakuNfts.map((item, key) => (
                  <DialogNftCard
                    key={key}
                    image={item.image ? item.image : ""}
                    mint={item.mint}
                    name={item.data.name}
                    nft={item}
                    setCard={props.setCard}
                    current={props.current}
                  />
                ))}
            </div>
          )}
        </>
      ) : (
        <>
          {props.fetchLoading ? (
            <h1>Loading...</h1>
          ) : (
            <div className="dialog-listed-box custom-scrollbar">
              {foxtopiaNfts.length !== 0 &&
                foxtopiaNfts.map((item, key) => (
                  <DialogNftCard
                    key={key}
                    image={item.image ? item.image : ""}
                    mint={item.mint}
                    name={item.data.name}
                    rarity={item.rank}
                    nft={item}
                    setCard={props.setCard}
                    current={props.current}
                  />
                ))}
            </div>
          )}
        </>
      )}
    </Dialog>
  );
}
