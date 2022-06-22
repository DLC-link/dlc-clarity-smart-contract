;;ERROR CODES
(define-constant err-unauthorised (err u2001))
(define-constant err-dlc-already-added (err u2002))
(define-constant err-unknown-dlc (err u2003))
(define-constant err-not-reached-closing-time (err u2004))
(define-constant err-already-closed (err u2005))
(define-constant err-already-passed-closing-time (err u2006))
(define-constant err-not-closed (err u2007))

;;CONTRACT OWNER
(define-constant contract-owner tx-sender)

;;NFT to keep track of the open dlcs easily
(define-non-fungible-token open-dlc (buff 8))

;;our map holding the DLCs
(define-map dlcs
	(buff 8)    ;;key
	{           ;;value
    uuid: (buff 8),
    asset: (buff 32),
    closing-time: uint,
    status: (optional uint),
    actual-closing-time: uint,
    emergency-refund-time: uint,
    creator: principal,
    outcome: (optional bool)
	})

;;HELPERS
(define-read-only (get-last-block-timestamp)
  (default-to u0 (get-block-info? time (- block-height u1))))

(define-read-only (get-dlc (uuid (buff 8)))
  (map-get? dlcs uuid))

;;opens a new dlc - only called by the dlc.link contract owner
(define-public (open-new-dlc (uuid (buff 8)) (asset (buff 32)) (closing-time uint) (emergency-refund-time uint) (creator principal))
  (begin
    (asserts! (is-eq contract-owner tx-sender) err-unauthorised)    ;;check if the caller is the owner
    (asserts! (is-none (map-get? dlcs uuid)) err-dlc-already-added) ;;check if DLC is already added or not if yes we throw an err
    (map-set dlcs uuid {       ;;set the new dlc under the uuid in our dlcs map
      uuid: uuid, 
      asset: asset, 
      closing-time: closing-time, 
      status: none, 
      actual-closing-time: u0, 
      emergency-refund-time: emergency-refund-time,
      creator: creator,
      outcome: none })
    (print {
      uuid: uuid,
      asset: asset, 
      closing-time: closing-time, 
      emergency-refund-time: emergency-refund-time,
      creator: creator}) ;;creator is going to be the tx-sender
    (nft-mint? open-dlc uuid .discreet-log-storage))) ;;mint an open-dlc nft to keep track of open dlcs

;;emits a print event to notify the dlc.link infrastructure to create a new DLC
(define-public (create-dlc (uuid (buff 8)) (asset (buff 32)) (closing-time uint) (emergency-refund-time uint))
  (begin 
    (print {
      uuid: uuid,
      asset: asset, 
      closing-time: closing-time, 
      emergency-refund-time: emergency-refund-time,
      creator: tx-sender}) ;;creator is going to be the tx-sender
    (ok true)))

;;normal dlc close
(define-public (close-dlc (uuid (buff 8)) (outcome bool))
  (let 
    (
      (dlc (unwrap! (get-dlc uuid) err-unknown-dlc)) ;;local variable for the dlc asked, throw err if unknown uuid passed
      (block-timestamp (get-last-block-timestamp))   ;;last block timestamp
    )
    (asserts! (>= block-timestamp (get closing-time dlc)) err-not-reached-closing-time) ;;check if block-timestamp passed the closing time specified in the dlc
    (asserts! (is-none (get status dlc)) err-already-closed)    ;;check if its already closed or not
    (asserts! (or (is-eq contract-owner tx-sender) (is-eq (get creator dlc) tx-sender)) err-unauthorised) ;;check if the caller is the contract owner or the creator
    (map-set dlcs uuid (merge dlc { status: (some u1), actual-closing-time: block-timestamp, outcome: (some outcome) })) ;;set the status and the actual-closing-time on our dlc
    (print {
      uuid: uuid,
      outcome: outcome})
    (nft-burn? open-dlc uuid .discreet-log-storage) ;;burn the open-dlc nft related to the UUID
      )) 
      

;;early dlc close (very similar to close-dlc)
(define-public (early-close-dlc (uuid (buff 8)) (outcome bool))
  (let (
    (dlc (unwrap! (get-dlc uuid) err-unknown-dlc))
    (block-timestamp (get-last-block-timestamp))
    )
    (asserts! (< block-timestamp (get closing-time dlc)) err-already-passed-closing-time) ;;checl if block-timestamp is smaller than closing time
    (asserts! (is-none (get status dlc)) err-already-closed)
    (asserts! (or (is-eq contract-owner tx-sender) (is-eq (get creator dlc) tx-sender)) err-unauthorised)
    (map-set dlcs uuid (merge dlc { status: (some u0), actual-closing-time: block-timestamp, outcome: (some outcome) })) ;;status is set 0, indicating early close
    (print {
      uuid: uuid,
      outcome: outcome})
    (nft-burn? open-dlc uuid .discreet-log-storage))) ;;burn the open-dlc nft related to the UUID

;; get the status of the DLC by UUID
(define-read-only (dlc-status (uuid (buff 8)))
(let (
    (dlc (unwrap! (get-dlc uuid) err-unknown-dlc)) ;;local variable for the dlc asked
    )
    (asserts! (is-some (get status dlc)) err-not-closed)  ;;check if it's already closed, if not throw err
    (ok (unwrap-panic (get status dlc)))))   ;;returning the dlc status
