// Subtle dotted background (spec 005, A13). CSS rewrite of the idea of
// Dot Pattern — Dillion Verma, Magic UI, MIT — https://21st.dev/@dillionverma/components/dot-pattern
// Place it as the first child of a positioned element.
export default function DotPattern() {
  return <span className="gw-fx-dots" aria-hidden="true" />
}
