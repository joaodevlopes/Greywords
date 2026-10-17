// Browser window frame for screenshots (spec 005, A10). CSS rewrite of the idea of
// Safari — Dillion Verma, Magic UI, MIT — https://21st.dev/@dillionverma/components/safari
// Shows the light or dark capture to match the page theme; the hidden one is display:none, so a
// lazy image is never downloaded and only the visible one reaches assistive tech.
export default function BrowserFrame({ label, light, dark, alt, width, height }) {
  return (
    <div className="gw-fx-browser">
      <div className="gw-fx-browser-bar" aria-hidden="true">
        <span className="gw-fx-browser-dots">
          <span />
          <span />
          <span />
        </span>
        <span className="gw-fx-browser-url">{label}</span>
      </div>
      <img className="gw-fx-shot gw-fx-shot-light" src={light} alt={alt} width={width} height={height} loading="lazy" decoding="async" />
      <img className="gw-fx-shot gw-fx-shot-dark" src={dark} alt={alt} width={width} height={height} loading="lazy" decoding="async" />
    </div>
  )
}
