---
title: Authentication
description: How authentication works
order: 1
---
# **BIZWIZ RELEASE NOTES - 01/05/2025**

# **HOTFIXES**

## **Sales and Receivables**

1.  Maintain Customers – Enhanced account-block notification to include pending outstanding balance and instructions to contact the account manager.
    
2.  Resolved issue causing duplicate stock movements on returns.
    
3.  Fixed device upload permissions—users with appropriate rights can now upload devices successfully.
    
4.  Disabled the return button for cash sales on the salesman print invoice page to prevent unintended return initiation.
    

!\[Screenshot from 2025-07-06 21-53-02.png\](Screenshot from 2025-07-06 21-53-02.png)

## **Inventory** 

1.  Stock Processing **–** Optimized Sales Short logic and Sales Returns pages.
    
2.  All **stock break operations** now enforce **unique reference numbers** across generated stock moves. Any attempt to create a stock move without a distinct reference is now rejected at the database level.
    

<video src="WhatsApp Video 2025-07-06 at 1.02.10 AM.mp4" controls></video>

## **Delivery and Logistics**

1.  Fixed the wrong branch display in the device listings in device management.
    

## **Petty Cash**

1.  VAT calculation on all petty cash requisitions has been corrected.
    

* * *

# **SCHEDULED RELEASES (NEW FEATURES)**

## **Fuel**

1.  Prevent adding zero quantities to the actual\_fuel\_quantity when creating fuel entries
    
2.  Fixed an issue where all fuel LPOs were incorrectly posted under “Thika Makongeni.” Fuel LPOs are now correctly tagged per branch.
    
3.  Creating Fuel LPOs through the API has been disabled to reduce misuse.
    
4.  Fuel LPOs can now only be created from the **web backend**, following directives to remove creation rights from the driver app/fuel attendant. 
    

## **OrderTaking & Delivery**

1.  Implement OTP verification on order delivery
    
2.  Show dialogue to confirm a shop’s location when onboarding or editing a shop
    
3.  Show dialogue to show the salesman's location on proximity errors when placing orders
    
4.  When approving offsite deliveries, the selected branch now persists until all associated shops have been approved, preventing automatic fallback to “All Branches.”
    
5.  Drivers are now only allowed to end their shift if they have completed 100% of their assigned deliveries.
    
6.  The driver app homepage now accurately displays the total number of **shops** and **centers remaining**, as customer goods are delivered.
    
7.  Merging and splitting of delivery schedules now supports **date-based filtering** of schedules.
    
8.  Added a tool to check for inconsistencies in **daily order-taking schedules**, ensuring shifts are in a consistent state.
    
9.  Vehicle assignment is now blocked for routes that have been merged, enforcing the correct operational flow.
    
10.  Implemented resending customer OTP when salesman reports shop no order
    

## **Fleet Management**

1.  Vehicles will now automatically **shut down at a configured evening time** and **power back on in the morning**, as set by Fleet Operations.
    

## **Petty Cash**

1.  There's now a filter to prevent budgeted expenses from creating multiple demands for the same user per source (Travel Order Taking, Travel Delivery, Travel GRN, etc).
    
2.  The SMS notification sent to the chairman when a building center or vehicle center requisition is ready for disbursements now shows the subject vehicle / building, the payee information, and the requisition user.
    
3.  When viewing a requisition, a user can now click on uploaded documents to zoom them.
    
4.  When viewing a vehicle center requisition, the vehicle number now has a hyperlink which shows vehicle's expense history.
    
5.  Inter branch travel GRN rates are now dynamic and configurable in the system.
    
6.  A driver will now get an SMS notification once a travel expense has been disbursed to them.
    

## **Sales and Receivables**

1.  Customer Purchase History - Monthly customer purchase history report showing Business Name, Customer Name, Route, Branch, Phone, Location, with Excel & PDF export.
    
2.  Fixed bug causing discount on saved sale not be deducted from payable amount when posting the sale
    
3.  Added back button on cashier summary view page
    
4.  Added 'ALL BRANCHES' select option to Route balance vs Route Customer Balances report
    
5.  Credit Sales Initiation: Improved flow now requires users to select a credit customer and request an OTP. The OTP sent to the approver includes customer details and current balance.
    
6.  Route EOD Activation: Enabled functionality for activating End-of-Day processes at the route level.
    
7.  Debtors Report: Enhanced to display breakdowns per route for better visibility.
    
8.  Cashier Restrictions: Cashiers are now restricted from making new sales or returns after declaring cash.
    
9.  Co-op Bank Paybill Configuration: Added support to configure Co-op Bank paybills per branch and per sales type (e.g., route or counter).
    

# **ERROR HANDLING**

1.  Improve error handling to prevent "big red screens" on API failure
    

* * *

## **QUALITY IMPROVEMENTS**

1.  Redis Integration for Caching: Configured Redis to improve application performance by reducing database load and enabling faster data retrieval through optimized caching.
    

# **NOTES / REMARKS**

This release includes critical fixes and feature enhancements aimed at ensuring operational accuracy, reducing misuse, and enhancing user experience.

We are continuously monitoring system behavior to proactively address issues and minimize downtime while improving system stability and performance
