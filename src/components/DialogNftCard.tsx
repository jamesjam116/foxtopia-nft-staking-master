import React from "react";
import { PageNftType } from "../contexts/types";

export default function DialogNftCard(props: {
  image: string;
  mint: string;
  name: string;
  nft: PageNftType;
  setCard: Function;
  current: PageNftType | undefined;
  rarity?: number;
}) {
  return (
    <div
      className={`dialog-nft-card ${
        props.current === props.nft ? "current" : ""
      }`}
      onClick={() => props.setCard(props.nft)}
    >
      {/* eslint-disable-next-line */}
      <img src={props.image} alt="" />
      <h5>{props.name}</h5>
      {props.rarity && <p>Rarity: {props.rarity}</p>}
    </div>
  );
}
