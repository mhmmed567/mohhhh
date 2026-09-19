export function ComingSoonStamp() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
      <div className="-rotate-12 rounded-lg border-[3px] border-amber-700 bg-white/90 px-5 py-3 text-center text-amber-800 shadow-lg">
        <p className="text-lg font-black">يتوفر قريب</p>
        <p className="mt-1 border-t border-amber-700/40 pt-1 text-xs font-bold">متاح للطلب المسبق</p>
      </div>
    </div>
  );
}
