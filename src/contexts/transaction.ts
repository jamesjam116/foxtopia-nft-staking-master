import {
  Edition,
  MetadataProgram,
} from "@metaplex-foundation/mpl-token-metadata";
import * as anchor from "@project-serum/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

import { IDL as StakingIDL } from "./staking";
import {
  PublicKey,
  Connection,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
} from "@solana/web3.js";
import {
  STAKING_PROGRAM_ID,
  GLOBAL_AUTHORITY_SEED,
  GlobalPool,
  FOXIE_TOKEN_MINT,
  USER_POOL_SIZE,
  FOXIE_TOKEN_DECIMAL,
  UserPool,
  USER_DUAL_POOL_SIZE,
  StakedData,
  EPOCH,
  UserDualPool,
} from "./types";
import {
  getAssociatedTokenAccount,
  getATokenAccountsNeedCreate,
  getNFTTokenAccount,
  getOwnerOfNFT,
  getMetadata,
  METAPLEX,
  isExistAccount,
  solConnection,
} from "./utils";
import { WalletContextState } from "@solana/wallet-adapter-react";
import {
  errorAlert,
  errorAlertBottom,
  infoAlert,
  successAlert,
  warningAlertBottom,
} from "../components/toastGroup";
import { SOLSCAN_API } from "../config";

export const initUserPool = async (wallet: WalletContextState) => {
  if (!wallet.publicKey) return 0;
  let userAddress: PublicKey = wallet.publicKey;
  let cloneWindow: any = window;

  let provider = new anchor.AnchorProvider(
    solConnection,
    cloneWindow["solana"],
    anchor.AnchorProvider.defaultOptions()
  );
  const program = new anchor.Program(
    StakingIDL as anchor.Idl,
    STAKING_PROGRAM_ID,
    provider
  );

  let timeout: any;
  let timeInterval: any;
  try {
    const tx = await createInitUserPoolTx(userAddress, program, solConnection);
    const txId = await wallet.sendTransaction(tx, solConnection);
    timeout = setTimeout(() => {
      // infoAlertBottom("Checking status...");
      timeInterval = setInterval(async () => {
        // infoAlertBottom("Checking status...");
        await fetch(`${SOLSCAN_API}${txId}`)
          .then((resp) => resp.json())
          .then(async (json) => {
            if (
              json.status.toLowerCase() === "success" &&
              json.signer?.length !== 0
            ) {
              clearTimeout(timeout);
              clearInterval(timeInterval);
              successAlert("Transaction is confirmed..");
            }
            if (json.status.toLowerCase() === "fail") {
              clearTimeout(timeout);
              clearInterval(timeInterval);
              errorAlert("Transaction is failed..");
            }
          })
          .catch((error) => {
            console.log(error);
          });
      }, 5000);
    }, 8000);
    // await solConnection.confirmTransaction(txId, "finalized");
    successAlert("Init user pool has been successful!");
  } catch (error: any) {
    clearTimeout(timeout);
    clearInterval(timeInterval);
    if (error.message) {
      // Blockhash not found
      if (error.message.indexOf("Blockhash not found") !== -1) {
        warningAlertBottom("Blockhash not found. Please try again");
      } else {
        errorAlertBottom(error.message);
      }
    }
  }
};

export const initUserDualPool = async (wallet: WalletContextState) => {
  if (!wallet.publicKey) return 0;
  let userAddress: PublicKey = wallet.publicKey;
  let cloneWindow: any = window;

  let provider = new anchor.AnchorProvider(
    solConnection,
    cloneWindow["solana"],
    anchor.AnchorProvider.defaultOptions()
  );
  const program = new anchor.Program(
    StakingIDL as anchor.Idl,
    STAKING_PROGRAM_ID,
    provider
  );

  let timeout: any;
  let timeInterval: any;
  try {
    const tx = await createInitUserDualPoolTx(
      userAddress,
      program,
      solConnection
    );
    const txId = await wallet.sendTransaction(tx, solConnection);
    timeout = setTimeout(() => {
      // infoAlertBottom("Checking status...");
      timeInterval = setInterval(async () => {
        // infoAlertBottom("Checking status...");
        await fetch(`${SOLSCAN_API}${txId}`)
          .then((resp) => resp.json())
          .then(async (json) => {
            if (
              json.status.toLowerCase() === "success" &&
              json.signer?.length !== 0
            ) {
              clearTimeout(timeout);
              clearInterval(timeInterval);
              successAlert("Transaction is confirmed..");
            }
            if (json.status.toLowerCase() === "fail") {
              clearTimeout(timeout);
              clearInterval(timeInterval);
              errorAlert("Transaction is failed..");
            }
          })
          .catch((error) => {
            console.log(error);
          });
      }, 5000);
    }, 8000);
    // await solConnection.confirmTransaction(txId, "finalized");
    successAlert("Init user pool has been successful!");
  } catch (error: any) {
    clearTimeout(timeout);
    clearInterval(timeInterval);
    if (error.message) {
      // Blockhash not found
      if (error.message.indexOf("Blockhash not found") !== -1) {
        warningAlertBottom("Blockhash not found. Please try again");
      } else {
        errorAlertBottom(error.message);
      }
    }
  }
};

export const stakeNFT = async (
  wallet: WalletContextState,
  nfts: {
    mint: PublicKey;
    rarity: number;
  }[],
  startLoading: Function,
  closeLoading: Function,
  updatePage: Function
) => {
  if (!wallet.publicKey) return 0;
  let userAddress: PublicKey = wallet.publicKey;
  let cloneWindow: any = window;

  let provider = new anchor.AnchorProvider(
    solConnection,
    cloneWindow["solana"],
    anchor.AnchorProvider.defaultOptions()
  );
  const program = new anchor.Program(
    StakingIDL as anchor.Idl,
    STAKING_PROGRAM_ID,
    provider
  );

  let userPoolKey = await anchor.web3.PublicKey.createWithSeed(
    userAddress,
    "user-pool",
    STAKING_PROGRAM_ID
  );

  startLoading();
  let poolAccount = await solConnection.getAccountInfo(userPoolKey);
  if (poolAccount === null || poolAccount.data === null) {
    await initUserPool(wallet);
  }

  let timeout: any;
  let timeInterval: any;

  try {
    let transactions: Transaction[] = [];
    for (let item of nfts) {
      const tx = await createStakeNftTx(
        item.mint,
        userAddress,
        program,
        solConnection,
        item.rarity
      );
      transactions.push(tx);
    }
    let { blockhash } = await provider.connection.getRecentBlockhash(
      "confirmed"
    );

    transactions.forEach((transaction) => {
      transaction.feePayer = wallet.publicKey as PublicKey;
      transaction.recentBlockhash = blockhash;
    });
    if (wallet.signAllTransactions !== undefined) {
      const signedTransactions = await wallet.signAllTransactions(transactions);

      let signatures = await Promise.all(
        signedTransactions.map((transaction) =>
          provider.connection.sendRawTransaction(transaction.serialize(), {
            skipPreflight: true,
            maxRetries: 3,
            preflightCommitment: "confirmed",
          })
        )
      );

      console.log(signatures, "===> SIngenation");

      infoAlert("A transaction request has been sent.");

      let faild = 0;
      let successed = 0;

      timeout = setTimeout(() => {
        timeInterval = setInterval(async () => {
          for (let i = 0; i < signatures.length; i++) {
            console.log(`${SOLSCAN_API}${signatures[i]}`);
            await fetch(`${SOLSCAN_API}${signatures[i]}`)
              .then((resp) => resp.json())
              .then(async (json) => {
                console.log(json, `===> json ${i}`);
                if (json.status === 404) {
                  faild++;
                }
                if (
                  json.status?.toLowerCase() === "fail" &&
                  json.signer?.length !== 0
                ) {
                  faild++;
                }
                if (
                  json.status?.toLowerCase() === "success" &&
                  json.signer?.length !== 0
                ) {
                  successed++;
                }
              })
              .catch((error) => {
                console.log(error);
              });
          }

          if (faild + successed === signatures.length) {
            if (successed > 0) {
              successAlert(
                `${successed} Transaction${
                  successed > 2 ? "s are" : " is"
                } confirmed.`
              );
            }
            if (faild > 0) {
              errorAlert(
                `${faild} Transaction${faild > 2 ? "s are" : " is"} failed.`
              );
            }
            clearTimeout(timeout);
            clearInterval(timeInterval);
            closeLoading();
            updatePage();
          }
        }, 5000);
      }, 8000);
    }
  } catch (error: any) {
    clearTimeout(timeout);
    clearInterval(timeInterval);
    if (error.message) {
      // Blockhash not found
      if (error.message.indexOf("Blockhash not found") !== -1) {
        warningAlertBottom("Blockhash not found. Please try again");
      } else {
        errorAlertBottom(error.message);
      }
    }
    closeLoading();
  }
};

export const stakeDualNFT = async (
  wallet: WalletContextState,
  hakuMint: PublicKey,
  foxMint: PublicKey,
  rarity: number,
  startLoading: Function,
  closeLoading: Function,
  updatePage: Function
) => {
  if (!wallet.publicKey) return 0;
  let userAddress: PublicKey = wallet.publicKey;
  let cloneWindow: any = window;

  startLoading();
  let provider = new anchor.AnchorProvider(
    solConnection,
    cloneWindow["solana"],
    anchor.AnchorProvider.defaultOptions()
  );
  const program = new anchor.Program(
    StakingIDL as anchor.Idl,
    STAKING_PROGRAM_ID,
    provider
  );

  let userPoolKey = await anchor.web3.PublicKey.createWithSeed(
    userAddress,
    "user-dual-pool",
    STAKING_PROGRAM_ID
  );

  let poolAccount = await solConnection.getAccountInfo(userPoolKey);
  if (poolAccount === null || poolAccount.data === null) {
    await initUserDualPool(wallet);
  }

  let timeout: any;
  let timeInterval: any;
  try {
    const tx = await createStakeDualTx(
      hakuMint,
      foxMint,
      userAddress,
      program,
      solConnection,
      rarity
    );
    const txId = await wallet.sendTransaction(tx, solConnection);
    timeout = setTimeout(() => {
      // infoAlertBottom("Checking status...");
      timeInterval = setInterval(async () => {
        // infoAlertBottom("Checking status...");
        await fetch(`${SOLSCAN_API}${txId}`)
          .then((resp) => resp.json())
          .then(async (json) => {
            if (
              json.status.toLowerCase() === "success" &&
              json.signer?.length !== 0
            ) {
              clearTimeout(timeout);
              clearInterval(timeInterval);
              successAlert("Transaction is confirmed..");
              closeLoading();
              updatePage();
            }
            if (json.status.toLowerCase() === "fail") {
              clearTimeout(timeout);
              clearInterval(timeInterval);
              errorAlert("Transaction is failed..");
            }
          })
          .catch((error) => {
            console.log(error);
          });
      }, 5000);
    }, 8000);
    // await solConnection.confirmTransaction(txId, "finalized");
  } catch (error: any) {
    clearTimeout(timeout);
    clearInterval(timeInterval);
    closeLoading();
    console.log(error);
    if (error.message) {
      // Blockhash not found
      if (error.message.indexOf("Blockhash not found") !== -1) {
        warningAlertBottom("Blockhash not found. Please try again");
      } else {
        errorAlertBottom(error.message);
      }
    }
  }
};

export const withdrawNft = async (
  wallet: WalletContextState,
  nfts: { mint: PublicKey }[],
  startLoading: Function,
  closeLoading: Function,
  updatePage: Function
) => {
  if (!wallet.publicKey) return 0;
  let userAddress: PublicKey = wallet.publicKey;
  let cloneWindow: any = window;

  let provider = new anchor.AnchorProvider(
    solConnection,
    cloneWindow["solana"],
    anchor.AnchorProvider.defaultOptions()
  );
  const program = new anchor.Program(
    StakingIDL as anchor.Idl,
    STAKING_PROGRAM_ID,
    provider
  );
  let timeout: any;
  let timeInterval: any;
  try {
    startLoading();
    let transactions: Transaction[] = [];
    for (let item of nfts) {
      const tx = await createWithdrawNftTx(
        item.mint,
        userAddress,
        program,
        solConnection
      );
      transactions.push(tx);
    }
    let { blockhash } = await provider.connection.getRecentBlockhash(
      "confirmed"
    );

    transactions.forEach((transaction) => {
      transaction.feePayer = wallet.publicKey as PublicKey;
      transaction.recentBlockhash = blockhash;
    });
    if (wallet.signAllTransactions !== undefined) {
      const signedTransactions = await wallet.signAllTransactions(transactions);

      let signatures = await Promise.all(
        signedTransactions.map((transaction) =>
          provider.connection.sendRawTransaction(transaction.serialize(), {
            skipPreflight: true,
            maxRetries: 3,
            preflightCommitment: "confirmed",
          })
        )
      );

      console.log(signatures, "===> SIngenation");

      infoAlert("A transaction request has been sent.");

      let faild = 0;
      let successed = 0;

      timeout = setTimeout(() => {
        timeInterval = setInterval(async () => {
          for (let i = 0; i < signatures.length; i++) {
            console.log(`${SOLSCAN_API}${signatures[i]}`);
            await fetch(`${SOLSCAN_API}${signatures[i]}`)
              .then((resp) => resp.json())
              .then(async (json) => {
                console.log(json, `===> json ${i}`);
                if (json.status === 404) {
                  faild++;
                }
                if (
                  json.status?.toLowerCase() === "fail" &&
                  json.signer?.length !== 0
                ) {
                  faild++;
                }
                if (
                  json.status?.toLowerCase() === "success" &&
                  json.signer?.length !== 0
                ) {
                  successed++;
                }
              })
              .catch((error) => {
                console.log(error);
              });
          }

          if (faild + successed === signatures.length) {
            if (successed > 0) {
              successAlert(
                `${successed} Transaction${
                  successed > 2 ? "s are" : " is"
                } confirmed.`
              );
            }
            if (faild > 0) {
              errorAlert(
                `${faild} Transaction${faild > 2 ? "s are" : " is"} failed.`
              );
            }
            clearTimeout(timeout);
            clearInterval(timeInterval);
            closeLoading();
            updatePage();
          }
        }, 5000);
      }, 8000);
    }
  } catch (error: any) {
    clearTimeout(timeout);
    clearInterval(timeInterval);
    if (error.message) {
      // Blockhash not found
      if (error.message.indexOf("Blockhash not found") !== -1) {
        warningAlertBottom("Blockhash not found. Please try again");
      } else {
        errorAlertBottom(error.message);
      }
    }
    closeLoading();
  }
};

export const withdrawDualNft = async (
  wallet: WalletContextState,
  nfts: {
    hakuMint: PublicKey;
    foxMint: PublicKey;
  }[],
  startLoading: Function,
  closeLoading: Function,
  updatePage: Function
) => {
  if (!wallet.publicKey) return 0;
  let userAddress: PublicKey = wallet.publicKey;
  let cloneWindow: any = window;

  let provider = new anchor.AnchorProvider(
    solConnection,
    cloneWindow["solana"],
    anchor.AnchorProvider.defaultOptions()
  );
  const program = new anchor.Program(
    StakingIDL as anchor.Idl,
    STAKING_PROGRAM_ID,
    provider
  );
  let timeout: any;
  let timeInterval: any;
  try {
    startLoading();
    let transactions: Transaction[] = [];

    for (let item of nfts) {
      const tx = await createWithdrawDualNftTx(
        item.hakuMint,
        item.foxMint,
        userAddress,
        program,
        solConnection
      );
      transactions.push(tx);
    }
    let { blockhash } = await provider.connection.getRecentBlockhash(
      "confirmed"
    );

    transactions.forEach((transaction) => {
      transaction.feePayer = wallet.publicKey as PublicKey;
      transaction.recentBlockhash = blockhash;
    });
    if (wallet.signAllTransactions !== undefined) {
      const signedTransactions = await wallet.signAllTransactions(transactions);

      let signatures = await Promise.all(
        signedTransactions.map((transaction) =>
          provider.connection.sendRawTransaction(transaction.serialize(), {
            skipPreflight: true,
            maxRetries: 3,
            preflightCommitment: "confirmed",
          })
        )
      );

      console.log(signatures, "===> SIngenation");

      infoAlert("A transaction request has been sent.");

      let faild = 0;
      let successed = 0;
      timeout = setTimeout(() => {
        timeInterval = setInterval(async () => {
          for (let i = 0; i < signatures.length; i++) {
            console.log(`${SOLSCAN_API}${signatures[i]}`);
            await fetch(`${SOLSCAN_API}${signatures[i]}`)
              .then((resp) => resp.json())
              .then(async (json) => {
                console.log(json, `===> json ${i}`);
                if (json.status === 404) {
                  faild++;
                }
                if (
                  json.status?.toLowerCase() === "fail" &&
                  json.signer?.length !== 0
                ) {
                  faild++;
                }
                if (
                  json.status?.toLowerCase() === "success" &&
                  json.signer?.length !== 0
                ) {
                  successed++;
                }
              })
              .catch((error) => {
                console.log(error);
              });
          }

          if (faild + successed === signatures.length) {
            if (successed > 0) {
              successAlert(
                `${successed} Transaction${
                  successed > 2 ? "s are" : " is"
                } confirmed.`
              );
            }
            if (faild > 0) {
              errorAlert(
                `${faild} Transaction${faild > 2 ? "s are" : " is"} failed.`
              );
            }
            clearTimeout(timeout);
            clearInterval(timeInterval);
            closeLoading();
            updatePage();
          }
        }, 5000);
      }, 8000);
    }
  } catch (error: any) {
    clearTimeout(timeout);
    clearInterval(timeInterval);
    if (error.message) {
      // Blockhash not found
      if (error.message.indexOf("Blockhash not found") !== -1) {
        warningAlertBottom("Blockhash not found. Please try again");
      } else {
        errorAlertBottom(error.message);
      }
    }
    closeLoading();
  }
};

export const claimReward = async (
  wallet: WalletContextState,
  startLoading: Function,
  closeLoading: Function,
  updatePage: Function,
  mint?: PublicKey
) => {
  if (!wallet.publicKey) return 0;
  let userAddress: PublicKey = wallet.publicKey;
  let cloneWindow: any = window;

  let provider = new anchor.AnchorProvider(
    solConnection,
    cloneWindow["solana"],
    anchor.AnchorProvider.defaultOptions()
  );
  const program = new anchor.Program(
    StakingIDL as anchor.Idl,
    STAKING_PROGRAM_ID,
    provider
  );

  console.log(mint ? mint.toBase58() : "Claim all");

  let timeout: any;
  let timeInterval: any;
  try {
    startLoading();
    const tx = await createClaimTx(userAddress, program, solConnection, mint);
    const txId = await wallet.sendTransaction(tx, solConnection);
    timeout = setTimeout(() => {
      // infoAlertBottom("Checking status...");
      timeInterval = setInterval(async () => {
        // infoAlertBottom("Checking status...");
        await fetch(`${SOLSCAN_API}${txId}`)
          .then((resp) => resp.json())
          .then(async (json) => {
            if (
              json.status.toLowerCase() === "success" &&
              json.signer?.length !== 0
            ) {
              clearTimeout(timeout);
              clearInterval(timeInterval);
              updatePage();
              successAlert("Transaction is confirmed..");
            }
            if (json.status.toLowerCase() === "fail") {
              clearTimeout(timeout);
              clearInterval(timeInterval);

              errorAlert("Transaction is failed..");
            }
          })
          .catch((error) => {
            console.log(error);
          });
      }, 5000);
    }, 8000);
    // await solConnection.confirmTransaction(txId, "finalized");
    successAlert("Init user pool has been successful!");
  } catch (error: any) {
    clearTimeout(timeout);
    clearInterval(timeInterval);
    closeLoading();
    if (error.message) {
      // Blockhash not found
      if (error.message.indexOf("Blockhash not found") !== -1) {
        warningAlertBottom("Blockhash not found. Please try again");
      } else {
        errorAlertBottom(error.message);
      }
    }
  }
};

export const claimDualReward = async (
  wallet: WalletContextState,
  startLoading: Function,
  closeLoading: Function,
  updatePage: Function,
  hakuMint?: PublicKey,
  foxMint?: PublicKey
) => {
  if (!wallet.publicKey) return 0;
  let userAddress: PublicKey = wallet.publicKey;
  let cloneWindow: any = window;

  let provider = new anchor.AnchorProvider(
    solConnection,
    cloneWindow["solana"],
    anchor.AnchorProvider.defaultOptions()
  );
  const program = new anchor.Program(
    StakingIDL as anchor.Idl,
    STAKING_PROGRAM_ID,
    provider
  );
  console.log(hakuMint && foxMint ? "Individual Claim" : "Claim all");

  let timeout: any;
  let timeInterval: any;
  try {
    startLoading();
    const tx = await createDualClaimTx(
      userAddress,
      program,
      solConnection,
      hakuMint,
      foxMint
    );
    const txId = await wallet.sendTransaction(tx, solConnection);
    timeout = setTimeout(() => {
      // infoAlertBottom("Checking status...");
      timeInterval = setInterval(async () => {
        // infoAlertBottom("Checking status...");
        await fetch(`${SOLSCAN_API}${txId}`)
          .then((resp) => resp.json())
          .then(async (json) => {
            if (
              json.status.toLowerCase() === "success" &&
              json.signer?.length !== 0
            ) {
              clearTimeout(timeout);
              clearInterval(timeInterval);
              successAlert("Transaction is confirmed..");
              updatePage();
              closeLoading();
            }
            if (json.status.toLowerCase() === "fail") {
              clearTimeout(timeout);
              clearInterval(timeInterval);
              errorAlert("Transaction is failed..");
            }
          })
          .catch((error) => {
            console.log(error);
          });
      }, 5000);
    }, 8000);

    updatePage();
    closeLoading();
    // await solConnection.confirmTransaction(txId, "finalized");
    successAlert("Init user pool has been successful!");
  } catch (error: any) {
    console.log(error);
    clearTimeout(timeout);
    clearInterval(timeInterval);
    closeLoading();
    if (error.message) {
      // Blockhash not found
      if (error.message.indexOf("Blockhash not found") !== -1) {
        warningAlertBottom("Blockhash not found. Please try again");
      } else {
        errorAlertBottom(error.message);
      }
    }
  }
};

export const createInitUserPoolTx = async (
  userAddress: PublicKey,
  program: anchor.Program,
  connection: Connection
) => {
  let userPoolKey = await anchor.web3.PublicKey.createWithSeed(
    userAddress,
    "user-pool",
    STAKING_PROGRAM_ID
  );
  console.log(USER_POOL_SIZE);
  let ix = SystemProgram.createAccountWithSeed({
    fromPubkey: userAddress,
    basePubkey: userAddress,
    seed: "user-pool",
    newAccountPubkey: userPoolKey,
    lamports: await connection.getMinimumBalanceForRentExemption(
      USER_POOL_SIZE
    ),
    space: USER_POOL_SIZE,
    programId: STAKING_PROGRAM_ID,
  });

  let tx = new Transaction();
  console.log("==>initializing user PDA", userPoolKey.toBase58());
  tx.add(ix);
  tx.add(
    program.instruction.initializeUserPool({
      accounts: {
        userPool: userPoolKey,
        owner: userAddress,
      },
      instructions: [],
      signers: [],
    })
  );

  return tx;
};

export const createInitUserDualPoolTx = async (
  userAddress: PublicKey,
  program: anchor.Program,
  connection: Connection
) => {
  let userPoolKey = await anchor.web3.PublicKey.createWithSeed(
    userAddress,
    "user-dual-pool",
    STAKING_PROGRAM_ID
  );
  console.log(USER_DUAL_POOL_SIZE);
  let ix = SystemProgram.createAccountWithSeed({
    fromPubkey: userAddress,
    basePubkey: userAddress,
    seed: "user-dual-pool",
    newAccountPubkey: userPoolKey,
    lamports: await connection.getMinimumBalanceForRentExemption(
      USER_DUAL_POOL_SIZE
    ),
    space: USER_DUAL_POOL_SIZE,
    programId: STAKING_PROGRAM_ID,
  });

  let tx = new Transaction();
  console.log("==>initializing user dual PDA", userPoolKey.toBase58());
  tx.add(ix);
  tx.add(
    program.instruction.initializeUserDualPool({
      accounts: {
        userDualPool: userPoolKey,
        owner: userAddress,
      },
      instructions: [],
      signers: [],
    })
  );

  return tx;
};

export const createStakeNftTx = async (
  mint: PublicKey,
  userAddress: PublicKey,
  program: anchor.Program,
  connection: Connection,
  rarity: number
) => {
  const [globalAuthority, bump] = await PublicKey.findProgramAddress(
    [Buffer.from(GLOBAL_AUTHORITY_SEED)],
    STAKING_PROGRAM_ID
  );

  let userPoolKey = await anchor.web3.PublicKey.createWithSeed(
    userAddress,
    "user-pool",
    STAKING_PROGRAM_ID
  );

  let userTokenAccount = await getAssociatedTokenAccount(userAddress, mint);
  if (!(await isExistAccount(userTokenAccount, connection))) {
    let accountOfNFT = await getNFTTokenAccount(mint, connection);
    if (userTokenAccount.toBase58() != accountOfNFT.toBase58()) {
      let nftOwner = await getOwnerOfNFT(mint, connection);
      if (nftOwner.toBase58() == userAddress.toBase58())
        userTokenAccount = accountOfNFT;
      else if (nftOwner.toBase58() !== globalAuthority.toBase58()) {
        throw "Error: Nft is not owned by user";
      }
    }
  }
  console.log("NFT = ", mint.toBase58(), userTokenAccount.toBase58());



  console.log("Dest NFT Account = ", destinationAccounts[0].toBase58());

  const metadata = await getMetadata(mint);

  console.log("Metadata=", metadata.toBase58());
  const editionId = await Edition.getPDA(mint);
  let remainingAccounts = [
    {
      pubkey: editionId,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: MetadataProgram.PUBKEY,
      isSigner: false,
      isWritable: false,
    },
  ];

  let tx = new Transaction();

  console.log("==>listing", mint.toBase58(), rarity);

  tx.add(
    program.instruction.stakeNftToPool(bump, new anchor.BN(rarity), {
      accounts: {
        owner: userAddress,
        globalAuthority,
        userPool: userPoolKey,
        userNftTokenAccount: userTokenAccount,
        nftMint: mint,
        mintMetadata: metadata,
        tokenProgram: TOKEN_PROGRAM_ID,
        tokenMetadataProgram: METAPLEX,
      },
      remainingAccounts,
      instructions: [],
      signers: [],
    })
  );

  return tx;
};

export const createStakeDualTx = async (
  hakuMint: PublicKey,
  foxMint: PublicKey,
  userAddress: PublicKey,
  program: anchor.Program,
  connection: Connection,
  rarity: number
) => {
  const [globalAuthority, bump] = await PublicKey.findProgramAddress(
    [Buffer.from(GLOBAL_AUTHORITY_SEED)],
    STAKING_PROGRAM_ID
  );

  let userDualPoolKey = await anchor.web3.PublicKey.createWithSeed(
    userAddress,
    "user-dual-pool",
    STAKING_PROGRAM_ID
  );

  let userHakuAccount = await getAssociatedTokenAccount(userAddress, hakuMint);
  if (!(await isExistAccount(userHakuAccount, connection))) {
    let accountOfNFT = await getNFTTokenAccount(hakuMint, connection);
    if (userHakuAccount.toBase58() != accountOfNFT.toBase58()) {
      let nftOwner = await getOwnerOfNFT(hakuMint, connection);
      if (nftOwner.toBase58() == userAddress.toBase58())
        userHakuAccount = accountOfNFT;
      else if (nftOwner.toBase58() !== globalAuthority.toBase58()) {
        throw "Error: Nft is not owned by user";
      }
    }
  }
  console.log("Haku NFT = ", hakuMint.toBase58(), userHakuAccount.toBase58());

  let userFoxAccount = await getAssociatedTokenAccount(userAddress, foxMint);
  if (!(await isExistAccount(userFoxAccount, connection))) {
    let accountOfNFT = await getNFTTokenAccount(foxMint, connection);
    if (userFoxAccount.toBase58() != accountOfNFT.toBase58()) {
      let nftOwner = await getOwnerOfNFT(foxMint, connection);
      if (nftOwner.toBase58() == userAddress.toBase58())
        userFoxAccount = accountOfNFT;
      else if (nftOwner.toBase58() !== globalAuthority.toBase58()) {
        throw "Error: Nft is not owned by user";
      }
    }
  }
  console.log("Fox NFT = ", foxMint.toBase58(), userFoxAccount.toBase58());

  const hakuMetadata = await getMetadata(hakuMint);
  const foxMetadata = await getMetadata(foxMint);

  const hakuEditionId = await Edition.getPDA(hakuMint);
  const foxEditionId = await Edition.getPDA(foxMint);

  let remainingAccounts = [
    {
      pubkey: hakuEditionId,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: foxEditionId,
      isSigner: false,
      isWritable: false,
    },
  ];

  let tx = new Transaction();

  tx.add(
    program.instruction.stakeDualToPool(bump, new anchor.BN(rarity), {
      accounts: {
        owner: userAddress,
        globalAuthority,
        userDualPool: userDualPoolKey,
        userHakuAccount,
        hakuMint,
        userFoxAccount,
        foxMint,
        hakuMetadata,
        foxMetadata,
        tokenProgram: TOKEN_PROGRAM_ID,
        tokenMetadataProgram: METAPLEX,
      },
      remainingAccounts,
      instructions: [],
      signers: [],
    })
  );

  return tx;
};

export const createWithdrawNftTx = async (
  mint: PublicKey,
  userAddress: PublicKey,
  program: anchor.Program,
  connection: Connection
) => {
  let ret = await getATokenAccountsNeedCreate(
    connection,
    userAddress,
    userAddress,
    [mint]
  );
  let userTokenAccount = ret.destinationAccounts[0];
  console.log("User NFT = ", mint.toBase58(), userTokenAccount.toBase58());

  const [globalAuthority, bump] = await PublicKey.findProgramAddress(
    [Buffer.from(GLOBAL_AUTHORITY_SEED)],
    STAKING_PROGRAM_ID
  );
  let rewardVault = await getAssociatedTokenAccount(
    globalAuthority,
    FOXIE_TOKEN_MINT
  );

  let userPoolKey = await anchor.web3.PublicKey.createWithSeed(
    userAddress,
    "user-pool",
    STAKING_PROGRAM_ID
  );

  let ret1 = await getATokenAccountsNeedCreate(
    connection,
    userAddress,
    userAddress,
    [FOXIE_TOKEN_MINT]
  );

  const editionId = await Edition.getPDA(mint);
  let remainingAccounts = [
    {
      pubkey: editionId,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: MetadataProgram.PUBKEY,
      isSigner: false,
      isWritable: false,
    },
  ];

  const metadata = await getMetadata(mint);

  let tx = new Transaction();

  if (ret.instructions.length > 0) ret.instructions.map((ix) => tx.add(ix));
  if (ret1.instructions.length > 0) ret1.instructions.map((ix) => tx.add(ix));
  console.log("==> withdrawing", mint.toBase58());

  tx.add(
    program.instruction.withdrawNftFromPool(bump, {
      accounts: {
        owner: userAddress,
        globalAuthority,
        userPool: userPoolKey,
        userNftTokenAccount: userTokenAccount,
        rewardVault,
        userRewardAccount: ret1.destinationAccounts[0],
        nftMint: mint,
        mintMetadata: metadata,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
      remainingAccounts,
      instructions: [],
      signers: [],
    })
  );

  return tx;
};

export const createWithdrawDualNftTx = async (
  hakuMint: PublicKey,
  foxMint: PublicKey,
  userAddress: PublicKey,
  program: anchor.Program,
  connection: Connection
) => {
  let ret = await getATokenAccountsNeedCreate(
    connection,
    userAddress,
    userAddress,
    [hakuMint, foxMint, FOXIE_TOKEN_MINT]
  );
  let userHakuAccount = ret.destinationAccounts[0];
  let userFoxAccount = ret.destinationAccounts[1];

  console.log(
    "User Haku NFT = ",
    hakuMint.toBase58(),
    userHakuAccount.toBase58()
  );
  console.log("User Fox NFT = ", foxMint.toBase58(), userFoxAccount.toBase58());

  const [globalAuthority, bump] = await PublicKey.findProgramAddress(
    [Buffer.from(GLOBAL_AUTHORITY_SEED)],
    STAKING_PROGRAM_ID
  );

  let rewardVault = await getAssociatedTokenAccount(
    globalAuthority,
    FOXIE_TOKEN_MINT
  );

  let userPoolKey = await anchor.web3.PublicKey.createWithSeed(
    userAddress,
    "user-dual-pool",
    STAKING_PROGRAM_ID
  );

  const hakuEditionId = await Edition.getPDA(hakuMint);
  const foxEditionId = await Edition.getPDA(foxMint);

  let remainingAccounts = [
    {
      pubkey: hakuEditionId,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: foxEditionId,
      isSigner: false,
      isWritable: false,
    },
  ];

  const hakuMetadata = await getMetadata(hakuMint);
  const foxMetadata = await getMetadata(foxMint);

  let tx = new Transaction();

  if (ret.instructions.length > 0) ret.instructions.map((ix) => tx.add(ix));
  console.log("==> withdrawing", hakuMint.toBase58(), foxMint.toBase58());

  tx.add(
    program.instruction.withdrawDualNftFromPool(bump, {
      accounts: {
        owner: userAddress,
        globalAuthority,
        userDualPool: userPoolKey,
        userHakuAccount,
        userFoxAccount,
        rewardVault,
        userRewardAccount: ret.destinationAccounts[2],
        hakuMint,
        foxMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        tokenMetadataProgram: METAPLEX,
      },
      remainingAccounts,
      instructions: [],
      signers: [],
    })
  );

  return tx;
};

export const createClaimTx = async (
  userAddress: PublicKey,
  program: anchor.Program,
  connection: Connection,
  mint?: PublicKey
) => {
  const [globalAuthority, bump] = await PublicKey.findProgramAddress(
    [Buffer.from(GLOBAL_AUTHORITY_SEED)],
    STAKING_PROGRAM_ID
  );
  let rewardVault = await getAssociatedTokenAccount(
    globalAuthority,
    FOXIE_TOKEN_MINT
  );

  let userPoolKey = await anchor.web3.PublicKey.createWithSeed(
    userAddress,
    "user-pool",
    STAKING_PROGRAM_ID
  );

  let ret = await getATokenAccountsNeedCreate(
    connection,
    userAddress,
    userAddress,
    [FOXIE_TOKEN_MINT]
  );

  let tx = new Transaction();

  if (ret.instructions.length > 0) ret.instructions.map((ix) => tx.add(ix));
  tx.add(
    program.instruction.claimReward(bump, mint ?? null, {
      accounts: {
        owner: userAddress,
        globalAuthority,
        userPool: userPoolKey,
        rewardVault,
        userRewardAccount: ret.destinationAccounts[0],
        tokenProgram: TOKEN_PROGRAM_ID,
      },
      instructions: [],
      signers: [],
    })
  );

  return tx;
};

export const createDualClaimTx = async (
  userAddress: PublicKey,
  program: anchor.Program,
  connection: Connection,
  hakuMint?: PublicKey,
  foxMint?: PublicKey
) => {
  const [globalAuthority, bump] = await PublicKey.findProgramAddress(
    [Buffer.from(GLOBAL_AUTHORITY_SEED)],
    STAKING_PROGRAM_ID
  );
  let rewardVault = await getAssociatedTokenAccount(
    globalAuthority,
    FOXIE_TOKEN_MINT
  );

  let userPoolKey = await anchor.web3.PublicKey.createWithSeed(
    userAddress,
    "user-dual-pool",
    STAKING_PROGRAM_ID
  );

  let ret = await getATokenAccountsNeedCreate(
    connection,
    userAddress,
    userAddress,
    [FOXIE_TOKEN_MINT]
  );

  let tx = new Transaction();

  if (ret.instructions.length > 0) ret.instructions.map((ix) => tx.add(ix));
  tx.add(
    program.instruction.claimDualReward(
      bump,
      hakuMint ?? null,
      foxMint ?? null,
      {
        accounts: {
          owner: userAddress,
          globalAuthority,
          userDualPool: userPoolKey,
          rewardVault,
          userRewardAccount: ret.destinationAccounts[0],
          tokenProgram: TOKEN_PROGRAM_ID,
        },
        instructions: [],
        signers: [],
      }
    )
  );

  return tx;
};

export const createWithdrawTx = async (
  userAddress: PublicKey,
  amount: number,
  program: anchor.Program,
  connection: Connection
) => {
  const [globalAuthority, bump] = await PublicKey.findProgramAddress(
    [Buffer.from(GLOBAL_AUTHORITY_SEED)],
    STAKING_PROGRAM_ID
  );
  let rewardVault = await getAssociatedTokenAccount(
    globalAuthority,
    FOXIE_TOKEN_MINT
  );

  let ret = await getATokenAccountsNeedCreate(
    connection,
    userAddress,
    userAddress,
    [FOXIE_TOKEN_MINT]
  );

  let tx = new Transaction();

  if (ret.instructions.length > 0) ret.instructions.map((ix) => tx.add(ix));
  tx.add(
    program.instruction.withdrawToken(
      bump,
      new anchor.BN(amount * FOXIE_TOKEN_DECIMAL),
      {
        accounts: {
          owner: userAddress,
          globalAuthority,
          rewardVault,
          userRewardAccount: ret.destinationAccounts[0],
          tokenProgram: TOKEN_PROGRAM_ID,
        },
        instructions: [],
        signers: [],
      }
    )
  );

  return tx;
};

export const getUserPoolInfo = async (userAddress: PublicKey) => {
  let cloneWindow: any = window;

  let provider = new anchor.AnchorProvider(
    solConnection,
    cloneWindow["solana"],
    anchor.AnchorProvider.defaultOptions()
  );
  const program = new anchor.Program(
    StakingIDL as anchor.Idl,
    STAKING_PROGRAM_ID,
    provider
  );
  const userInfo: UserPool | null = await getUserPoolState(userAddress);
  if (userInfo)
    return {
      owner: userInfo.owner.toBase58(),
      lastClaimedTime: userInfo.lastClaimedTime.toNumber(),
      stakedCount: userInfo.stakedCount.toNumber(),
      staking: userInfo.staking.map((info) => {
        return {
          mint: info.mint.toBase58(),
          stakedTime: info.stakedTime.toNumber(),
          claimedTime: info.claimedTime.toNumber(),
          rarity: info.rate.toNumber(),
        };
      }),
    };
};

export const getGlobalInfo = async () => {
  let cloneWindow: any = window;

  let provider = new anchor.AnchorProvider(
    solConnection,
    cloneWindow["solana"],
    anchor.AnchorProvider.defaultOptions()
  );
  const program = new anchor.Program(
    StakingIDL as anchor.Idl,
    STAKING_PROGRAM_ID,
    provider
  );
  const globalPool: GlobalPool | null = await getGlobalState();
  if (globalPool) {
    const result = {
      admin: globalPool.superAdmin.toBase58(),
      totalStakedCount: globalPool.totalStakedCount.toNumber(),
    };

    return result;
  }
};

export const getAllNFTs = async (rpc?: string) => {
  return await getAllStakedNFTs(solConnection);
};

export const getGlobalState = async (): Promise<GlobalPool | null> => {
  let cloneWindow: any = window;
  let provider = new anchor.AnchorProvider(
    solConnection,
    cloneWindow["solana"],
    anchor.AnchorProvider.defaultOptions()
  );
  const program = new anchor.Program(
    StakingIDL as anchor.Idl,
    STAKING_PROGRAM_ID,
    provider
  );
  const [globalAuthority, _] = await PublicKey.findProgramAddress(
    [Buffer.from(GLOBAL_AUTHORITY_SEED)],
    STAKING_PROGRAM_ID
  );
  try {
    let globalState = await program.account.globalPool.fetch(globalAuthority);
    return globalState as unknown as GlobalPool;
  } catch {
    return null;
  }
};

export const getUserPoolState = async (
  userAddress: PublicKey
): Promise<UserPool | null> => {
  let cloneWindow: any = window;
  let provider = new anchor.AnchorProvider(
    solConnection,
    cloneWindow["solana"],
    anchor.AnchorProvider.defaultOptions()
  );
  const program = new anchor.Program(
    StakingIDL as anchor.Idl,
    STAKING_PROGRAM_ID,
    provider
  );
  let userPoolKey = await anchor.web3.PublicKey.createWithSeed(
    userAddress,
    "user-pool",
    STAKING_PROGRAM_ID
  );
  try {
    let userPoolState = await program.account.userPool.fetch(userPoolKey);
    return userPoolState as unknown as UserPool;
  } catch {
    return null;
  }
};

export const getAllStakedNFTs = async (connection: Connection) => {
  let solConnection = connection;

  let poolAccounts = await solConnection.getProgramAccounts(
    STAKING_PROGRAM_ID,
    {
      filters: [
        {
          dataSize: USER_POOL_SIZE,
        },
      ],
    }
  );

  let result: UserPool[] = [];

  try {
    for (let idx = 0; idx < poolAccounts.length; idx++) {
      let data = poolAccounts[idx].account.data;
      const owner = new PublicKey(data.slice(8, 40));

      let buf = data.slice(40, 48).reverse();
      const lastClaimedTime = new anchor.BN(buf);

      buf = data.slice(48, 56).reverse();
      const stakedCount = new anchor.BN(buf);

      buf = data.slice(56, 64).reverse();
      const accumulatedReward = new anchor.BN(buf);

      let staking: any = [];
      for (let i = 0; i < stakedCount.toNumber(); i++) {
        const mint = new PublicKey(data.slice(i * 56 + 64, i * 56 + 96));

        buf = data.slice(i * 56 + 88 + 8, i * 56 + 96 + 8).reverse();
        const stakedTime = new anchor.BN(buf);
        buf = data.slice(i * 56 + 96 + 8, i * 56 + 104 + 8).reverse();
        const claimedTime = new anchor.BN(buf);
        buf = data.slice(i * 56 + 104 + 8, i * 56 + 112 + 8).reverse();
        const rarity = new anchor.BN(buf);

        staking.push({
          mint,
          stakedTime,
          claimedTime,
          rarity,
        });
      }

      result.push({
        owner,
        lastClaimedTime,
        stakedCount,
        accumulatedReward,
        staking,
      });
    }
  } catch (e) {
    console.log(e);
    return {};
  }

  return {
    count: result.length,
    data: result.map((info: UserPool) => {
      return {
        owner: info.owner.toBase58(),
        lastClaimedTime: info.lastClaimedTime.toNumber(),
        stakedCount: info.stakedCount.toNumber(),
        accumulatedReward: info.accumulatedReward.toNumber(),
        staking: info.staking.map((info) => {
          return {
            mint: info.mint.toBase58(),
            stakedTime: info.stakedTime.toNumber(),
            claimedTime: info.claimedTime.toNumber(),
            rarity: info.rate,
          };
        }),
      };
    }),
  };
};

export const createInitializeTx = async (
  userAddress: PublicKey,
  program: anchor.Program
) => {
  const [globalAuthority, bump] = await PublicKey.findProgramAddress(
    [Buffer.from(GLOBAL_AUTHORITY_SEED)],
    STAKING_PROGRAM_ID
  );
  const rewardVault = await getAssociatedTokenAccount(
    globalAuthority,
    FOXIE_TOKEN_MINT
  );
  console.log(rewardVault.toBase58());

  let tx = new Transaction();
  console.log("==>initializing program", rewardVault.toBase58());

  tx.add(
    program.instruction.initialize(bump, {
      accounts: {
        admin: userAddress,
        globalAuthority,
        rewardVault,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      },
      instructions: [],
      signers: [],
    })
  );

  return tx;
};

export const calculateReward = async (
  wallet: WalletContextState,
  nftMint: PublicKey
) => {
  if (!wallet.publicKey) return 0;
  let userAddress: PublicKey = wallet.publicKey;
  let cloneWindow: any = window;

  let provider = new anchor.AnchorProvider(
    solConnection,
    cloneWindow["solana"],
    anchor.AnchorProvider.defaultOptions()
  );
  const program = new anchor.Program(
    StakingIDL as anchor.Idl,
    STAKING_PROGRAM_ID,
    provider
  );

  const globalPool: GlobalPool | null = await getGlobalState();
  if (globalPool === null) return 0;

  const userPool: UserPool | null = await getUserPoolState(userAddress);
  if (userPool === null) return 0;

  let slot = await solConnection.getSlot();
  let now = await solConnection.getBlockTime(slot);
  if (now === null) return 0;

  let reward = 0;

  for (let i = 0; i < userPool.stakedCount.toNumber(); i++) {
    if (userPool.staking[i].mint.toBase58() === nftMint.toBase58()) {
      reward =
        (Math.floor(
          (480 * (now - userPool.staking[i].claimedTime.toNumber())) / EPOCH
        ) *
          (userPool.staking[i].rate as anchor.BN).toNumber()) /
        480;
    }
  }
  return reward / FOXIE_TOKEN_DECIMAL;
};

export const calculateAllRewards = async (wallet: WalletContextState) => {
  if (wallet.publicKey === null) return 0;

  let userAddress: PublicKey = wallet.publicKey;
  let cloneWindow: any = window;

  let provider = new anchor.AnchorProvider(
    solConnection,
    cloneWindow["solana"],
    anchor.AnchorProvider.defaultOptions()
  );
  const program = new anchor.Program(
    StakingIDL as anchor.Idl,
    STAKING_PROGRAM_ID,
    provider
  );

  const globalPool: GlobalPool | null = await getGlobalState();
  if (globalPool === null) return 0;

  const userPool: UserPool | null = await getUserPoolState(userAddress);
  if (userPool === null) return 0;

  let slot = await solConnection.getSlot();
  let now = await solConnection.getBlockTime(slot);
  if (now === null) return 0;

  let total_reward = 0;

  for (let i = 0; i < userPool.stakedCount.toNumber(); i++) {
    let lastClaimedTime = userPool.lastClaimedTime.toNumber();
    if (lastClaimedTime < userPool.staking[i].claimedTime.toNumber()) {
      lastClaimedTime = userPool.staking[i].claimedTime.toNumber();
    }

    let reward =
      (Math.floor(
        (480 * (now - userPool.staking[i].claimedTime.toNumber())) / EPOCH
      ) *
        (userPool.staking[i].rate as anchor.BN).toNumber()) /
      480;

    total_reward += reward;
  }

  return total_reward / FOXIE_TOKEN_DECIMAL;
};

export const getUserDualPoolState = async (
  userAddress: PublicKey
): Promise<UserDualPool | null> => {
  let cloneWindow: any = window;
  let provider = new anchor.AnchorProvider(
    solConnection,
    cloneWindow["solana"],
    anchor.AnchorProvider.defaultOptions()
  );
  const program = new anchor.Program(
    StakingIDL as anchor.Idl,
    STAKING_PROGRAM_ID,
    provider
  );
  let userPoolKey = await anchor.web3.PublicKey.createWithSeed(
    userAddress,
    "user-dual-pool",
    STAKING_PROGRAM_ID
  );
  try {
    let userPoolState = await program.account.userDualPool.fetch(userPoolKey);
    return userPoolState as unknown as UserDualPool;
  } catch {
    return null;
  }
};

export const getAllDualStakedNFTs = async (
  connection: Connection,
  rpcUrl: string | undefined
) => {
  let solConnection = connection;

  if (rpcUrl) {
    solConnection = new anchor.web3.Connection(rpcUrl, "confirmed");
  }

  let poolAccounts = await solConnection.getProgramAccounts(
    STAKING_PROGRAM_ID,
    {
      filters: [
        {
          dataSize: USER_DUAL_POOL_SIZE,
        },
      ],
    }
  );

  console.log(`Encounter ${poolAccounts.length} NFT Data Accounts`);

  let result: UserDualPool[] = [];

  try {
    for (let idx = 0; idx < poolAccounts.length; idx++) {
      let data = poolAccounts[idx].account.data;
      const owner = new PublicKey(data.slice(8, 40));

      let buf = data.slice(40, 48).reverse();
      const lastClaimedTime = new anchor.BN(buf);

      buf = data.slice(48, 56).reverse();
      const stakedCount = new anchor.BN(buf);

      buf = data.slice(56, 64).reverse();
      const accumulatedReward = new anchor.BN(buf);

      let staking: any = [];
      for (let i = 0; i < stakedCount.toNumber(); i++) {
        const mintHaku = new PublicKey(
          data.slice(i * 88 + 56 + 8, i * 88 + 88 + 8)
        );
        const mintFox = new PublicKey(
          data.slice(i * 88 + 56 + 8 + 32, i * 88 + 88 + 8 + 32)
        );

        buf = data.slice(i * 88 + 88 + 8 + 32, i * 88 + 96 + 8 + 32).reverse();
        const stakedTime = new anchor.BN(buf);
        buf = data.slice(i * 88 + 96 + 8 + 32, i * 88 + 104 + 8 + 32).reverse();
        const claimedTime = new anchor.BN(buf);
        buf = data
          .slice(i * 88 + 104 + 8 + 32, i * 88 + 112 + 8 + 32)
          .reverse();
        const rarity = new anchor.BN(buf);

        staking.push({
          mintHaku,
          mintFox,
          stakedTime,
          claimedTime,
          rarity,
        });
      }

      result.push({
        owner,
        lastClaimedTime,
        stakedCount,
        accumulatedReward,
        staking,
      });
    }
  } catch (e) {
    console.log(e);
    return {};
  }

  return {
    count: result.length,
    data: result.map((info: UserDualPool) => {
      return {
        owner: info.owner.toBase58(),
        lastClaimedTime: info.lastClaimedTime.toNumber(),
        stakedCount: info.stakedCount.toNumber(),
        staking: info.staking.map((info) => {
          return {
            mintHaku: info.mintHaku.toBase58(),
            mintFox: info.mintFox.toBase58(),
            stakedTime: info.stakedTime.toNumber(),
            claimedTime: info.claimedTime.toNumber(),
            rarity: info.rate.toNumber(),
          };
        }),
      };
    }),
  };
};
