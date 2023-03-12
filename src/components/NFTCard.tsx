import { Skeleton } from "@mui/material";
import { PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";
import { getNftMetaData } from "../contexts/utils";

export default function NFTCard(props: {
  mint: string;
  staked: boolean;
  rank: number;
  selected: boolean;
  handleSelect: Function;
  forceRender: boolean;
}) {
  const [image, setImage] = useState("");
  const [nftIndex, setNftIndex] = useState("");
  const [selected, setSelected] = useState(false);
  const [name, setName] = useState("");
  const getNFTdetail = async () => {
    const uri = await getNftMetaData(new PublicKey(props.mint));
    await fetch(uri)
      .then((resp) => resp.json())
      .then((json) => {
        setName(json.name);
        const str = json.name.split("#");
        setImage(json.image);
        setNftIndex(str[1]);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const handleClick = () => {
    setSelected(!selected);
    props.handleSelect(props.mint, !selected);
  };

  useEffect(() => {
    setSelected(props.selected);
    getNFTdetail();
    // eslint-disable-next-line
  }, [props.mint]);

  return (
    <div
      className={`nft-card ${selected && "selected"} ${
        props.staked && "staked"
      }`}
      onClick={() => handleClick()}
    >
      <div className="nft-card-content">
        <div className="media">
          {image ? (
            <>
              {/* eslint-disable-next-line */}
              <img src={image} alt="" />
            </>
          ) : (
            <Skeleton
              variant="rectangular"
              width={139}
              height={158}
              sx={{ backgroundColor: "#fffefe15" }}
              style={{ borderRadius: 15 }}
              animation="wave"
            />
          )}
          <div className="card-content">
            <p className="nft-name">#{nftIndex}</p>
            {name.toLowerCase().indexOf("haku") === -1 && (
              <p className="nft-name">{`Rank ${props.rank}`}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
