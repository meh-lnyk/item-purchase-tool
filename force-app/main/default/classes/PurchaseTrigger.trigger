trigger PurchaseTrigger on PurchaseLine__c (after insert, after delete, after update) {
    Set<Id> purchaseIds = new Set<Id>();

    if (Trigger.isInsert || Trigger.isUpdate) {
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

    List<Purchase__c> purchasesToUpdate = new List<Purchase__c>();

    for (Id pid : purchaseIds) {
        List<PurchaseLine__c> lines = [
            SELECT Amount__c, UnitCost__c FROM PurchaseLine__c WHERE PurchaseId__c = :pid
        ];

        Integer totalItems = 0;
        Decimal grandTotal = 0;

        for (PurchaseLine__c line : lines) {
            totalItems += (line.Amount__c != null ? line.Amount__c.intValue() : 0);
            grandTotal += (line.Amount__c != null && line.UnitCost__c != null)
                ? line.Amount__c * line.UnitCost__c
                : 0;
        }

        purchasesToUpdate.add(new Purchase__c(
            Id = pid,
            TotalItems__c = totalItems,
            GrandTotal__c = grandTotal
        ));
    }

    if (!purchasesToUpdate.isEmpty()) {
        update purchasesToUpdate;
    }
}
