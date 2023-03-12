import "../styles/style.scss";
import Wallet from "../components/wallet/Wallet";
import { ToastContainer } from "react-toastify";
import PageLoading from "../components/PageLoading";
import { useState, useEffect } from "react";

function RaffleApp({ Component, pageProps }) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (document) {
      if (loading) {
        document.getElementsByTagName("body")[0].style.overflow = "none";
      } else {
        document.getElementsByTagName("body")[0].style.overflow = "auto";
      }
    }
  }, [loading]);

  return (
    <Wallet>
      <Component
        {...pageProps}
        startLoading={() => setLoading(true)}
        closeLoading={() => setLoading(false)}
      />
      <ToastContainer style={{ fontSize: 14 }} pauseOnHover={false} />
      <PageLoading loading={loading} />
    </Wallet>
  );
}

export default RaffleApp;
