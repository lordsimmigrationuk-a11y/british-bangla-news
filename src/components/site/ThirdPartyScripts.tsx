import Script from "next/script";
import { getSettings, adsActive } from "@/lib/settings";

/** Analytics and ad scripts load only when an administrator has configured them. */
export async function ThirdPartyScripts() {
  const s = await getSettings();
  const ga = /^G-[A-Z0-9]+$/.test(s.ga4Id) ? s.ga4Id : null;
  return (
    <>
      {ga && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga}',{anonymize_ip:true});`}
          </Script>
        </>
      )}
      {adsActive(s) && (
        <Script
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${s.adsenseClientId}`}
          strategy="lazyOnload"
          crossOrigin="anonymous"
        />
      )}
    </>
  );
}
