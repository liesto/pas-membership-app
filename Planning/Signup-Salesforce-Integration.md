This is a scoping document for the signup page. 

# Overview
This page is for new membership creation.  This page will create a new contact in Salesforce.  For the create contact in salesforce, use the same code structure that we have in the create-account page.  It will then create an opportunity in Salesforce that contains the membership information.  
- Note:  We're not yet integrating with a payment provider, so we're not actually taking payment.  We'll do that later.  
- Note:  We're not yet building an Auth user in Clerk.com.  We'll do that after we get this first batch of work done.  

# Form fields
## Contact
Here are the fields that will get pushed to the Salesforce Contact Object
Form field: Salesforce Contact field
First Name:
Last Name:
Email: 
Phone: 
Street Address:
City: 
State: 
Zip Code:
Email Opt-in: 

# Opportunity fields
Here are the fields that will get pushed to the Salesforce Opportunity Object
Form field: Salesforce Opportunity field
Payment Frequency: Membership_Term__c (Month or Year)
Membership Level: npe01__Member_Level__c (Bronze, Silver or Gold)

Other fields that need to get pushed to the Opportunity record. 
Name: Conactenate (FirstName," ",LastName" - ",Member Level," "Date)
RecordTypeId: 0124x000001aYWcAAM
npsp__Primary_Contact__c: ContactId of the contact
AccountId: This will be the AccountId from the Contact Object in Salesforce
CloseDate: Today's date
StageName: Closed Won
CampaignId: 701U700000XmsUbIAJ
Type: PAS Membership
npe01__Membership_Start_Date__c: Today's Date
npe01__Membership_End_Date__c: If Membership_Term__c = Month; Today's date + 1 month.  If Membership_Term__c = Year; Today's date + 1 year
npe01__Membership_Origin__c: New
Amount: Bronze/Year = 50, Bronze/Month = 5, Silver/Year = 100, Silver/Month = 10, Gold/Year = 250, Gold/Month = 25

# Salesforce sequencing
- You'll need to add the Contact in Salesforce first.  
- you'll need to have Contact fields available from Salesforce to populate some of the Opportunity fields. 