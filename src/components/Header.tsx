import { useWallet } from "@solana/wallet-adapter-react";
import { WalletModalProvider, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Link from "next/link";
import { useState } from "react";
import { CloseIcon, MenuIcon } from "./svgIcons";

export default function Header() {
    const [open, setOpen] = useState(false);

    return (
        <header className="header">
            <div className="header-content container">
                <div className="header-left">
                    <Link href="/">
                        <a>
                            {/* eslint-disable-next-line */}
                            <img
                                src="/img/logo.png"
                                alt=""
                            />
                        </a>
                    </Link>
                </div>
                <div className="header-right">
                    <WalletModalProvider>
                        <WalletMultiButton />
                    </WalletModalProvider>
                    <div className="mobile-menu">
                        <button onClick={() => setOpen(!open)}>
                            {open ?
                                <CloseIcon color="#fff" />
                                :
                                <MenuIcon color="#fff" />
                            }
                        </button>
                    </div>
                </div>
            </div>
        </header>
    )
}