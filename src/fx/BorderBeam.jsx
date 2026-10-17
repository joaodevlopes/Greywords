// Light beam travelling along a container's border (spec 005, A6). CSS rewrite of the idea of
// Border Beam — Dillion Verma, Magic UI, MIT — https://21st.dev/@dillionverma/components/border-beam
// Place it as the last child of a positioned element; it inherits the border radius.
export default function BorderBeam() {
  return (
    <span className="gw-fx-beam" aria-hidden="true">
      <span className="gw-fx-beam-light gw-fx-loop" />
    </span>
  )
}
