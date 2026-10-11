# Personal Finance Manager 

A web application for tracking personal income and expenses, monitoring monthly finances, and managing transactions in one place. It includes user accounts, a financial dashboard, and customizable settings.

## Features

* **User Authentication:** Sign up, log in, and log out using email and password.
* **Financial Dashboard:** View monthly income, expenses, net balance, spending breakdown by category, and recent transactions.
* **Transaction Management:** Add, edit, delete, and filter transactions by month and category.
* **Custom Categories:** Manage categories to organize income and expenses.
* **Personalized Settings:** Update profile details and passwords, choose a currency symbol, and set the default dashboard month.
* **Account Management:** Delete your account when needed.
* **Responsive Design:** Access the application on desktop and mobile devices.

## Tech Stack

| Technology          | Purpose                                        |
| ------------------- | ---------------------------------------------- |
| React               | User interface                                 |
| TypeScript          | Type-safe JavaScript development               |
| Tailwind CSS        | Styling and responsive design                  |
| Supabase            | Database, authentication, and backend services |
| PostgreSQL          | Database management                            |
| Vite                | Development server and build tooling           |
| Recharts / Chart.js | Financial charts and visualizations            |

**Development Tool:** Built with the assistance of Bolt.

## Project Structure

```text
Personal-Finance-Manager/
├── src/
│   ├── components/    # Reusable UI components
│   ├── pages/         # Dashboard, Transactions, Settings, Login, Signup
│   ├── lib/            # Supabase client and helper functions
│   └── ...
├── supabase/           # Database setup files, if included
├── public/              # Static assets, if included
├── .env                 # Local environment variables (not committed)
├── .gitignore
├── package.json
├── index.html
└── README.md
```

*Note: This is an example structure. Adjust it to match your actual project files.*

## Getting Started

### Prerequisites

Make sure you have the following installed:

* [Node.js](https://nodejs.org/) version 18 or later
* npm
* A [Supabase](https://supabase.com/) project

### 1. Clone the Repository

Replace the placeholders with your GitHub username and repository name.

```bash
git clone https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
cd YOUR-REPOSITORY
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project's root directory and add your Supabase project credentials:

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Replace the placeholder values with the appropriate credentials from your Supabase project.

### 4. Configure the Database

If your repository includes database setup files in the `supabase/` directory, run the required SQL in the Supabase SQL Editor.

Ensure that the necessary Row-Level Security (RLS) policies are configured correctly for your database tables.

### 5. Start the Development Server

```bash
npm run dev
```

### 6. Open the Application

Open the local URL displayed in your terminal. With the default Vite configuration, it is usually:

```text
http://localhost:5173
```

## Security

* Supabase Authentication manages user authentication.
* Row-Level Security policies should restrict users to accessing only their authorized data.
* Environment variables containing credentials should not be committed to GitHub.
* Add `.env` to `.gitignore` to help prevent accidental exposure of local credentials.

## Future Improvements

* Set monthly budgets for individual categories.
* Add alerts when spending exceeds a budget.
* Support CSV imports from bank statements.
* Add recurring income and expense transactions.

## License

Choose a license, such as the MIT License, if you intend to distribute the project under those terms. Add the corresponding `LICENSE` file to your repository.
