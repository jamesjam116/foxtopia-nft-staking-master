import { useState, useEffect } from "react";
import { PageNftType } from "../contexts/types";
import NftSelectDialog from "./NftSelectDialog";
import { CardCloseIcon } from "./svgIcons";

export default function DualAbleCard(props: {
  nfts: any;
  rarity?: number;
  isHaku?: boolean;
  setNft: Function;
}) {
  const [currentNft, setCurrentNft] = useState<PageNftType | undefined>();

  const [showNfts, setShowNfts] = useState(false);

  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchedNfts, setFetchedNfts] = useState<PageNftType[]>([]);

  useEffect(() => {
    props.setNft(currentNft);
    // eslint-disable-next-line
  }, [currentNft]);

  const getNftMetaData = async () => {
    let promise: any = [];
    setFetchLoading(true);
    for (let item of props.nfts) {
      const image = fetch(item.data.uri)
        .then((resp) => resp.json())
        .then((json) => {
          return json.image;
        })
        .catch((error) => {
          return "";
        });
      promise.push(image);
    }
    const images = await Promise.all(promise);
    let allNfts = props.nfts;
    for (let i = 0; i < allNfts.length; i++) {
      allNfts[i].image = images[i];
    }
    setFetchedNfts(allNfts);
    setFetchLoading(false);
  };

  useEffect(() => {
    getNftMetaData();
    // eslint-disable-next-line
  }, [props.nfts]);
  return (
    <>
      <div className="isdual-card">
        {currentNft && (
          <button
            className="clear-btn"
            onClick={() => setCurrentNft(undefined)}
          >
            <CardCloseIcon />
          </button>
        )}
        <div className="dual-card" onClick={() => setShowNfts(true)}>
          <div className="dual-card-image">
            {props.isHaku ? (
              // eslint-disable-next-line
              <img
                src={currentNft ? currentNft.image : "/img/haku-hidden.png"}
                style={{ opacity: !currentNft ? 0.4 : 1 }}
                alt=""
              />
            ) : (
              // eslint-disable-next-line
              <img
                src={currentNft ? currentNft.image : "/img/fox-hidden.png"}
                style={{ opacity: !currentNft ? 0.4 : 1 }}
                alt=""
              />
            )}
            {props.isHaku ? (
              <div className="card-temp-content">
                {!currentNft ? (
                  <h5>Haku</h5>
                ) : (
                  <h5>{currentNft.data.name}</h5>
                )}
              </div>
            ) : (
              <div className="card-temp-content">
                {!currentNft ? (
                  <h5>Fox</h5>
                ) : (
                  <>
                    <h5>{currentNft.data.name}</h5>
                    <p>Rarity: {currentNft.rank}</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <NftSelectDialog
          open={showNfts}
          onClose={() => setShowNfts(false)}
          nfts={fetchedNfts}
          current={currentNft}
          setCard={setCurrentNft}
          fetchLoading={fetchLoading}
          isHaku={props.isHaku}
        />
      </div>
    </>
  );
}
