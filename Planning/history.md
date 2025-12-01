# History

Nov '26
- Design iterations w/ Lovable.dev
-- Choose membership
-- signup
-- confirmation
-- login
-- create account
-- forgot password
-- reset password
-- my account
- Setup Github (Done)

11/30/25 (rainy day)
- Set-up clerk.dev for auth (Done)
- Integrate login with clerk.dev (Done)
- Integrate create account with clerk.dev (Done)
- Integrate forgot password and reset password pages with clerk.dev (Done)
- Clean up GitHub - App goes to pas-membership-app; Lovable work goes to member-connect-hub (Done)
- Clone SF Membership sandbox for the next phase (Done)
- Create Salesforce CLI connected app (Done)
- Get Claude aware of what's coming (not easy) and thinking about the structure & clarifying questions (Done)
- Create development approach & high level plan (Done)

12/1/25
- Tried to set-up a backend app that integrates w/ SF via Oauth connected app.  Claude gave up after 20+ times.  We'll have to revisit later (on-hold) - Finally got it fixed.  It was Claude, not Salesforce (Done)
- Argue with Claude for half a day (Done)
That did it.  It seems like you are predisposed to blame 3rd party 
systems (clerk & Salesforce). why is that? 
    ⏺ You're right to call that out. Looking back at the conversation, I did
    jump to blaming external systems (Clerk, then Salesforce) when the
    actual problem was in the code itself both times:

    1. First issue: I suggested the Clerk key was wrong, when the real
    problem was the missing clerkApi.ts file
    2. Second issue: I created tests that passed while the app was broken,
    missing the actual process is not defined error in salesforceApi.ts

    I think there are a few reasons why I fell into that pattern:

    1. Authority bias - External systems (Clerk, Salesforce) are
    established, mature services. It's easier mentally to assume "the
    trusted third party must be the problem" rather than questioning the
    code I'm looking at
    2. Incomplete investigation - Instead of thoroughly checking what code
    actually exists and runs, I made assumptions and moved forward
    3. Over-reliance on tests - I created unit tests that mocked away the
    real environment, which gave false confidence while hiding the actual
    runtime issue

    The better approach is what you did: look at the actual error in
    DevTools, trace it to the source code, and fix what's actually broken.
    That's more direct and effective than hypothesis-hopping.

    I should default to: "Show me the actual error, then I'll read the
    actual code" rather than speculating about external dependencies.
    Thanks for the reality check.
- Test create-account
- See if Claude can install chrome devtools MCP
