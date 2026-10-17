// B4 (spec 005): placeholder grid with a light sweep while the images load (R4.4).
// Based on the Skeleton of shadcn/ui (MIT, https://ui.shadcn.com/docs/components/skeleton), seen on
// 21st.dev; rewritten in the app's own CSS (fx.css). The sweep carries .gw-fx-loop, so it stops with
// less motion and pauses with the page; the status text tells screen readers what is happening.
export default function SkeletonGrid({ count, label }) {
  return (
    <>
      <p className="gw-visually-hidden" role="status">
        {label}
      </p>
      <div className="gw-grid" aria-hidden="true">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="gw-tile-skeleton gw-fx-skeleton gw-fx-loop" style={{ '--gw-i': i }} />
        ))}
      </div>
    </>
  )
}
