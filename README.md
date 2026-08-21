# Room Harmony

Create a modern responsive web application called "Unani Hospital Room Management System".

The application is used by a hospital receptionist and administrator to manage patient rooms and admissions.

Create a professional hospital management dashboard with a clean, modern UI.

Main requirements:

1. Dashboard

- Show total rooms

- Show available rooms

- Show occupied rooms

- Show reserved rooms

- Show rooms under maintenance

- Show today's admissions and expected discharges

2. Room Management

- Display hospital rooms visually using cards, similar to a theater seat booking interface

- Each room card should show room number, room type and current status

- Available rooms should be visually distinct from occupied, reserved and maintenance rooms

- Clicking an available room should open a patient admission form

- Clicking an occupied room should show the current patient and booking information

3. Patient Admission Form

Include:

- Patient name

- Age

- Gender

- Phone number

- Address

- Guardian name

- Guardian phone number

- Selected room number

- Admission date

- Expected discharge date

4. Booking System

- A patient can stay approximately one month

- The system should store admission and expected discharge dates

- Prevent double booking of a room

- Show remaining days until expected discharge

- Show warnings for upcoming or overdue discharge dates

- Maintain booking history

5. Room Calendar

- Create a calendar or timeline view for each room

- Show past, current and future bookings

- Make it easy to see when a room is available

6. Patient Management

- Search patients

- View patient details

- View current room

- View admission history

- Discharge patients

7. Discharge System

- Allow receptionist to discharge a patient

- Record actual discharge date

- Change room status back to available

- Preserve booking history

8. User Roles

- Admin

- Receptionist

Use a modern hospital-style dashboard design with a sidebar, responsive layout, cards, tables, modals and forms.

Use React, TypeScript, Tailwind CSS and a component-based architecture.

Create realistic sample data and a polished user experience.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://hospify-roomie.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5bed1057-96d8-40d4-8c6c-32470b2cb130).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
