trigger PurchaseTrigger on PurchaseLine__c (after insert, after update, after delete, after undelete) {
    Set<Id> purchaseIds = new Set<Id>();

    if (Trigger.isInsert || Trigger.isUpdate || Trigger.isUndelete) {
        for (PurchaseLine__c line : Trigger.new) {
            if (line.PurchaseId__c != null) {
                purchaseIds.add(line.PurchaseId__c);
            }
        }
    }

    if (Trigger.isDelete) {
        for (PurchaseLine__c line : Trigger.old) {
            if (line.PurchaseId__c != null) {
                purchaseIds.add(line.PurchaseId__c);
            }
        }
    }

    Map<Id, List<PurchaseLine__c>> linesByPurchase = new Map<Id, List<PurchaseLine__c>>();
    for (PurchaseLine__c line : [
        SELECT PurchaseId__c, Amount__c, UnitCost__c
        FROM PurchaseLine__c
        WHERE PurchaseId__c IN :purchaseIds
    ]) {
        if (!linesByPurchase.containsKey(line.PurchaseId__c)) {
            linesByPurchase.put(line.PurchaseId__c, new List<PurchaseLine__c>());
        }
        linesByPurchase.get(line.PurchaseId__c).add(line);
    }

    List<Purchase__c> purchasesToUpdate = new List<Purchase__c>();

    for (Id purchaseId : linesByPurchase.keySet()) {
        Integer totalItems = 0;
        Decimal grandTotal = 0;

        for (PurchaseLine__c line : linesByPurchase.get(purchaseId)) {
            totalItems += 1;
            if (line.Amount__c != null && line.UnitCost__c != null) {
                grandTotal += line.Amount__c * line.UnitCost__c;
            }
        }

        purchasesToUpdate.add(new Purchase__c(
            Id = purchaseId,
            TotalItems__c = totalItems,
            GrandTotal__c = grandTotal
        ));
    }

    if (!purchasesToUpdate.isEmpty()) {
        update purchasesToUpdate;
    }
}
