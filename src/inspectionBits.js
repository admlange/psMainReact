// Shared client-side bits decoder (keep in sync with psMainNode)
export const InspectionResultPropertyBits = {
  REJECTIONAPPROVED: 1,
  FINALIZED: 2,
  REWORKAPPROVED: 4
};
export function decodeInspectionBits(propertyBits=0){
  return {
    rejectionApproved: (propertyBits & InspectionResultPropertyBits.REJECTIONAPPROVED) === InspectionResultPropertyBits.REJECTIONAPPROVED,
    finalized: (propertyBits & InspectionResultPropertyBits.FINALIZED) === InspectionResultPropertyBits.FINALIZED,
    reworkApproved: (propertyBits & InspectionResultPropertyBits.REWORKAPPROVED) === InspectionResultPropertyBits.REWORKAPPROVED
  };
}
export function deriveResultStage({ inspectionResultTypeName, propertyBits }){
  const { finalized, rejectionApproved, reworkApproved } = decodeInspectionBits(propertyBits);
  const NotInGoodOrder = 'Not in good order';
  const InGoodOrder = 'All in good order as far as could be observed';
  const FinalizedNotInGoodOrder = 'Finalized - Not in good order';
  const InGoodOrderAfterOurRepairs = 'All in good order after our repairs';
  const InGoodOrderAfterExternalRepairs = 'All in good order after external repairs';
  if (!inspectionResultTypeName) return 'NR';
  if (inspectionResultTypeName === NotInGoodOrder && !rejectionApproved) return 'RTBA';
  if (inspectionResultTypeName === NotInGoodOrder && rejectionApproved && !reworkApproved) return 'RWBA';
  const tbf = (
    ((inspectionResultTypeName === InGoodOrder || inspectionResultTypeName === FinalizedNotInGoodOrder) && !finalized) ||
    ((inspectionResultTypeName === InGoodOrderAfterExternalRepairs || inspectionResultTypeName === InGoodOrderAfterOurRepairs) && !finalized) ||
    (inspectionResultTypeName === NotInGoodOrder && rejectionApproved && reworkApproved && !finalized)
  );
  if (tbf) return 'TBF';
  if (finalized) return 'FIN';
  return 'ERROR';
}
