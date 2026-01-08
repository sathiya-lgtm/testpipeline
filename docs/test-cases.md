## Table of contents
- [Testing how the Camera List responds to clicks](#camera-list-clicks)

# Camera List Clicks

## As Service Provider (Dashboard and/or Forensic Search page)

### 1. Open Customer dropdown

- Customer dropdown should open and attempt load a list of Sites, subsequently displaying "loading skeleton" beneath Customer name temporarily.
- If successfully fetching list of Sites, Customer name should highlight blue.
- If sites are available for Customer, should display a list of Sites.
- If Sites are not available for Customer, should display text similar to "No sites have been registered to this account".
- If fetch fails, Customer dropdown should close, not be highlighted blue, and a toast error notification should appear.


### 2. Swap between pages (Dashboard, Forensic Search, and Camera Config) with Customer dropdown open.

- Customer name should remain highlighted.
- Customer dropdown should remain open.


### 3. Close Customer dropdown by clicking on highlighted Customer name again.

- Customer dropdown should close and no longer be highlighted blue.


### 4. Swap between pages with Customer dropdown closed (Dashboard, Forensic Search, and Camera Config).

- Customer dropdown should remain closed and not highlighted across pages.


### 5. Repeat steps 1-4 with different Customer(s).

- Should observe the same behavior (detailed in steps 1-4).


### 6. Repeat steps 1-5 across Dashboard and Forensic Search page (ignore this step for Camera Configuration page as it should behave differently).

- Should observe the same behavior detailed in steps 1-5.


### 7. Open Customer dropdown, then open Site dropdown.

- Site dropdown should open and attempt to load a list of Cameras, subsequently displaying "loading skeleton" beneath Site name temporarily.
- If successfully fetching list of Sites, Customer and Site name should highlight blue.
- If Cameras are available for Site, should display a list of Cameras.
- If Cameras are not available for Site, should display text similar to "camera not available for this site".
- If fetch failed, should close Site dropdown and display error toast notification.


### 8. Swap between pages with Site dropdown open (Dashboard, Forensic Search, and Camera Config).

- Customer and Site name should remain highlighted blue.
- Customer and Site dropdown should remain open.
- Cameras registered to Site should remain in view.


### 9. Close Site dropdown by clicking on highlighted Site name again.

- Site dropdown should close and no longer be highlighted blue.
- Customer dropdown should remain open and remain highlighted blue.


### 10. Swap between pages (Dashboard, Forensic Search, Camera Config) with Site closed.

- Site dropdown should remain closed.
- Site name should not be highlighted.

### 11. Repeat step 3

- Should observe results from step 3


### 12. Open Customer dropdown, then open Site dropdown. Then close highlighted Customer dropdown

- Should observe Customer dropdown and Site dropdown are now closed an not highlight blue.


### 13. Repeat step 7 for 2+ more Customers (without closing any of Customer or Site dropdowns)

- Should observe multiple Customer and Site dropdowns remain open.
- Should observe only the most recently opened Customer and Site dropdown is highlighted blue.


### 14. Close one of the non-highlighted Sites by clicking on an open Site dropdown again

- Should observe non-highlighted Site closing without effecting the Customer and Site that is currently highlight blue.


### 15. Close one of the non-highlighted Customers

- Should observe non-highlighted Customer closing without effecting the Customer and Site that is currently highlight blue.


### 16. Close all Customer dropdowns

- Should observe all Customer dropdowns being closed and nothing being highlighted blue.


## As Service Provider (Dashboard only)

### 17. Open Customer dropdown

- Should observe Customer name appearing above dashboard.
- Should observe dashboard data being limited to selected Customer.


### 18. Swap between pages (Forensic Search, Camera Configuration, then back to Dashboard)

- Should observe results from step 17.


### 19. Close Customer dropdown

- Should observe Customer name disappearing above dashboard.
- Should observe dashboard data reflecting data across all Customers.


### 20. Swap between pages (Forensic Search, Camera Configuration, then back to Dashboard)

- Should observe results from step 19.


### 21. Open Customer dropdown, then Site dropdown

- Should observe Customer name and Site name appearing above dashboard.
- Should observe dashboard data reflecting data limited to selected Site.


### 22. Swap between pages (Forensic Search, Camera Configuration, then back to Dashboard)

- Should observe results from step 21.


### 23. Close Site dropdown by clicking on highlighted site again

- Should observe Site name above dashboard disappearing.
- Should observe Customer name remaining above dashboard.
- Should observe dashboard data being limited to selected Customer (i.e. all Customer sites).


### 24. Swap between pages (Forensic Search, Camera Configuration, then back to Dashboard)

- Should observe results from step 23.


### 25. Repeat step 21, then close Customer by clicking highlighted Customer

- Should observe both Customer name and Site name disappearing.
- Should observe dashboard data reflecting all Customers.


### 26. Swap between pages (Forensic Search, Camera Configuration, then back to Dashboard)

- Should observe results from step 25.


### 27. Open Customer, then open Site, then click on Camera

- Should observe Camera name, Site name, and Customer name being highlighted blue.
- Should observe Customer name, Site name, and Camera name above dashboard.
- Should observe dashboard data reflecting data limited to selected Camera.


### 28. Deselect Camera by clicking on highlighted camera again

- Should observe Camera name disappearing from dashboard.
- Should observe Customer name and Site name remaining above dashboard.
- Should observe dashboard data reflecting data limited to selected Site.


### 29. Repeat step 27, then step 23

- Should observe results from step 23.


### 30. Repeat step 27, then repeat step 19

- Should observe results of step 19.


## As Service Provider (Forensic Search)

### 31. Open Customer dropdown

- Should observe Customer filter selection being populated.
- Should observe Customer filter selection options being available.
- If Sites are registered for Customer, should observe Site options being available on Site filter selection.
- Should observe Camera options are not available.


### 32. Close Customer dropdown

- Should observe Customer filter being removed.
- Should observe Customer selection options being available.
- Should observe Site and Camera options are not available.


### 33. Open Customer dropdown, then open Site dropdown

- Should observe Customer and Site filter selections being populated.
- Should observe Customer and Site filter selection options being available.
- If Cameras are registered for Site, should observe Camera options being available on Camera filter selection.


### 34. Close Site dropdown by clicking on highlighted Site

- Should observe Site filter selection being removed.
- Should observe Customer filter selection remaining.
- Should observe Customer and Site filter selection options being available.


### 35. Repeat step 32

- Should observe same results as step 32.


### 36. Open Customer dropdown, then open Site dropdown, then open Camera dropdown

- Should observe Customer, Site, and Camera filter selections being populated.
- Should observe Customer, Site, and Camera filter selection options being available.


### 37. Deactivate Camera by selecting highlighted camera again

- Should observe Camera filter selection being removed.
- Should observe Customer filter selection and Site filter selection remaining.
- Should observe Customer, Site, and Camera filter selection options being available.


### 38. Repeat step 34, then step 32

- Should observe results from 32.


### 39. Repeat step 36 then remove Camera filter selection via filter

- Should observe same results as step 37.


### 40. Remove Site filter selection via filter

- Should observe results from step 34.


### 41. Remove Customer filter selection via filter

- Should observe results from step 32.


### 42. Select a Camera for two+ different Customers from Camera List dropdown (not Forensic Search filter dropdowns)

- Should observe Customer, Site, and Camera filter selections correspond to dropdowns as you open dropdowns and activate cameras
- Should observe Customer, Site, and Camera filter selection options being available that correspond to open dropdowns and active camera.


### 43. Clear filter selections by clicking "Clear" button

- Should observe all filter selections being removed.
- Should observe Customer name, Site name, and Camera name no longer being highlighted (on Camera List).

### 44. Select a Customer from Forensic Search filter dropdown

- Should observe Customer filter selection being populated.
- Should observe Customer filter selection options being available.
- If Sites are registered for Customer, should observe corresponding Site options being available on Site filter selection.
- Should observe Camera options are not available.

### 45. Select a Site from Forensic Search filter dropdown

- Should observe Customer and Site filter selections being populated.
- Should observe Customer and Site filter selection options being available.
- If Cameras are registered for Site, should observe corresponding Camera options being available on Camera filter selection.

# 46. Select a Camera from Forensic Search filter dropdown

- Should observe Customer, Site, and Camera filter selections being populated.
- Should observe Customer, Site, and Camera filter selection options being available.


### 47. Switch to Dashboard, open Customer dropdown from Camera List while on Dashboard, then switch to Forensic Search page

- Should observe Customer filter selection being populated.
- Should observe Customer filter selection options being available.
- If Sites are registered for Customer, should observe Site options being available on Site filter selection.
- Should observe Camera options are not available.


### 48. Switch to Dashboard page, then Close Customer dropdown while on Dashboard, then switch to Forensic Search page

- Should observe Customer filter being removed.
- Should observe Customer selection options being available.
- Should observe Site and Camera options are not available.


### 49. Switch to Dashboard page, then open a Site dropdown while on Dashboard, then switch to Forensic Search page

- Should observe Customer and Site filter selections being populated.
- Should observe Customer and Site filter selection options being available.
- If Cameras are registered for Site, should observe Camera options being available on Camera filter selection.


### 50. Switch to Dashboard page, then open a close Site dropdown while on Dashboard, then switch to Forensic Search page

- Should observe Site filter selection being removed.
- Should observe Customer filter selection remaining.
- Should observe Customer and Site filter selection options being available.


### 51. Switch to Dashboard page, then select a Camera from Camera List while on Dashboard, then switch to Forensic Search page

- Should observe Customer, Site, and Camera filter selections being populated.
- Should observe Customer, Site, and Camera filter selection options being available.


### 52. Switch to Dashboard page, then deselect a Camera from Camera List while on Dashboard, then switch to Forensic Search page

- Should observe Camera filter selection being removed.
- Should observe Customer filter selection and Site filter selection remaining.
- Should observe Customer, Site, and Camera filter selection options being available.


## As a Service Provider (Camera Configuration Page only)

### 53. Select a Camera from Camera List while on the Dashboard page, then go to the Camera Configuration page

- Should observe Customer, Site, and Camera remain highlighted blue.
- Should observe Camera Configuration page loading most recent event clip for selected Camera.


### 54. Select a Camera from Camera List while on the Forensic Search page, then go to the Camera Configuration page

- Should observe Customer, Site, and Camera remain highlighted blue.
- Should observe Camera Configuration page loading camera data for selected Camera.


### 55. Attempt to deselect a Camera by clicking on highlighted Camera again (while on Camera Configuration page)

- Should observe nothing happens.


### 56. Open an additional Customer dropdown without closing the one featuring the Camera that is already selected

- Should observe nothing happens.


### 57. Open an additional Site dropdown without closing the one that features the Camera that is already selected

- Should observe nothing happens.


### 58. Select another Camera from a different Customer and Site than the one already selected

- Should observe new Customer name, Site name, and Camera name being highlighted.
- Should observe Camera Configuration page now displaying data for newly selected Camera.