# ⭐ HemoConnect ⭐

<div align="center">
  <img src="public/file.svg" alt="HemoConnect Logo" width="150"/>
</div>

<p align="center">
  <strong>An AI-powered forum and peer-matching platform for the hemophilia community.</strong>
</p>

<p align="center">
  <a href="#-core-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-contributing">Contributing</a> •
  <a href="#-license">License</a>
</p>

---

HemoConnect is an innovative platform designed to connect individuals within the hemophilia community based on shared experiences, challenges, and life stages. Our mission is to reduce isolation and foster meaningful, supportive connections through intelligent, AI-driven tools.

## 🚀 Core Features

This platform enhances the traditional forum experience with personalized and supportive features:

*   **🧠 Smart Post Categorization:** AI automatically categorizes new posts by factor deficiency, treatment type, life stage, and more, making information intuitive to find.
*   **🤝 Intelligent User Matching:** A detailed profile setup allows our platform to suggest "peer" connections with others who share similar profiles and life experiences.
*   **🔍 AI-Powered Semantic Search:** Ask questions in natural language (e.g., *"how to handle joint bleeds in teens"*) and receive the most relevant results from past discussions.
*   **📚 Resource Library:** A curated, searchable database of helpful articles, links, and documents, complete with AI-generated summaries for long-form content.
*   **💬 Community Forum:** A safe and secure space for all standard community features, including creating posts, commenting, upvoting, and anonymous posting for sensitive topics.

## 💻 Tech Stack

This project is built with a modern, scalable, and cost-effective tech stack, ideal for solo development and rapid iteration.

| Category      | Technology                                                                                             |
|---------------|--------------------------------------------------------------------------------------------------------|
| **Frontend**  | [Next.js](https://nextjs.org/) (with React)                                                            |
| **Styling**   | [Tailwind CSS](https://tailwindcss.com/)                                                               |
| **UI Lib**    | [shadcn/ui](https://ui.shadcn.com/)                                                                    |
| **Database**  | [Supabase](https://supabase.io/) (PostgreSQL)                                                          |
| **Auth**      | [Supabase Auth](https://supabase.io/docs/guides/auth)                                                  |
| **AI / NLP**  | [Hugging Face](https://huggingface.co/) (Inference APIs)                                               |
| **Deployment**| [Vercel](https://vercel.com/)                                                                          |

## 🏁 Getting Started

Follow these steps to get a local copy up and running.

### Prerequisites

*   [Node.js](https://nodejs.org/en/) (v18 or later)
*   `npm`, `pnpm`, or `yarn`
*   A [Supabase](https://supabase.io/) account (for Database and Auth)
*   A [Hugging Face](https://huggingface.co/) account (for AI models)

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/YOUR_USERNAME/HemoConnect.git
    cd HemoConnect
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Set up your environment variables:**

    Create a file named `.env.local` in the root of the project and add your API keys.

    ```env
    NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
    HUGGING_FACE_TOKEN=YOUR_HUGGING_FACE_READ_TOKEN
    ```

4.  **Run the development server:**
    ```sh
    npm run dev
    ```

5.  **Open your browser:**

    Navigate to [http://localhost:3000](http://localhost:3000) to see the application running.

> [!NOTE]
> This project is currently in active development.

## 🙌 Contributing

Contributions are welcome! If you have ideas for improvements or want to report a bug, please open an issue or submit a pull request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m '''Add some AmazingFeature'''`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for more information.
