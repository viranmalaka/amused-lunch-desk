the main idea is to create a app to select daily lunch/breakfast options. when the final menu are availabe for the day employees can select correctly, but before that they can keep selected their preferences like chicken/fish/veg or salads so that when admin adds the final options it'll take automatically based on the prefernces. but any how if the user changes his mind they can go an update the options.

- this is a simple application that supports all my office to add the breakfast / lunch options daily.
- people can log in to the applicaction via azure ad auth and it takes the name of the employee.
- there are two role in the application where admin can go and edit the menu daily and employees can go and submit their prefernces.
- employees can submit their prefernces for the future as well which helps them not to miss submitting the lunch/breakfast options each day morning.
- daily, admin updates the nextday breakfast options day before that day evening. admin updates the lunch options everyday in the morning.
- admin will be able to see the sumarry (count) of each options asked for each meal(eg: chicken fried rice -1, egg fried rice - 3)
- admin will be able to take a print of all the names and the ordered option so that the meal can be tagged by the person name.
- admin will set the menu each day morning. and can share a link in teams, we should create a beautiful seo tag to show the menu without openning the link inside teams chat.
- when employee select a future day for lunch, but yet the options are not avaialble, they should be able to select their preferences like chicken, veg, red-rice or salads.
- employees can select their default options so that when the click on the link that we share in the teams, they land to the page and directly they can just click submit without thinking much as the options is aready selected as user perference. This is a user level property, not a date-base property.

users has their prefernces for menu. so that they can make their default choises (controll by admin on DB)

- Chicken
- Veg
- Salad
- Red Rice

each day admin can define the menu item as follows

- Biriyani - Chicken (this should be linked to Chicken Prefernece)
- Biriyani - Egg
- Biriyani - Veg (this should be linked to Veg Prefernece)
- Red Rice Chicken (this should be linked to Red Rice Prefernece)
- Salad (this should be linked to Salad Prefernece)

senario: user select chicken as thier prefered option for future date(feb 20), by the time system does not know what'll be the menu for feb 20. on feb 20 monring, admin adds the menu to the system and it has "Biriyani - Chicken" under chicken preference. so then the system will automtically convert the menu options as "Biriyani - Chicken" for the users who selects checken. no need any manually checks.

technologies: NextJS with trpc and server actions and server components, postgress db, prisma, shadcn as UI lib. the app should be mobile responsive mainly for the employees as they need to submit the meal option by mobile.

please note that keep the azure ad setup as the last part and until that we need a way to log in users. create the login page with inputbox to add email and log in. we can create users in the DB manually. I'm doing this as currently I have only access to 1 ad account which I cannot test propeerly.
