import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen px-6 py-12 md:px-12">
      <header className="max-w-4xl mx-auto flex justify-between items-center mb-16">
        <h1 className="text-3xl font-heading font-bold text-marker-blue">Omnia AI</h1>
        <div className="space-x-4">
          <Link href="/login" className="text-ink hover:underline">Log in</Link>
          <Link href="/signup" className="bg-marker-blue text-white px-6 py-3 rounded-btn font-medium">
            Sign up
          </Link>
        </div>
      </header>

      <section className="max-w-3xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6">
          Turn any idea into a whiteboard explainer video
        </h2>
        <p className="text-lg mb-8 text-ink/80">
          Teachers, trainers, and marketers create clear cartoon videos in minutes. Free plan includes 5 videos a day.
        </p>
        <Link href="/signup" className="inline-block bg-marker-blue text-white px-8 py-4 rounded-btn text-lg font-medium">
          Create your first video free
        </Link>
      </section>

      <section className="max-w-4xl mx-auto mt-20 grid md:grid-cols-3 gap-6">
        <div className="bg-soft-gray/50 p-6 rounded-card">
          <h3 className="font-heading text-xl mb-2">Free</h3>
          <p className="text-2xl font-bold">5 videos/day</p>
          <p className="text-sm mt-2">Up to 4 min · Watermark</p>
        </div>
        <div className="bg-soft-gray/50 p-6 rounded-card">
          <h3 className="font-heading text-xl mb-2">Starter</h3>
          <p className="text-2xl font-bold">15 videos/day</p>
          <p className="text-sm mt-2">Up to 7 min · No watermark</p>
        </div>
        <div className="bg-soft-gray/50 p-6 rounded-card border-2 border-marker-orange">
          <h3 className="font-heading text-xl mb-2">Pro</h3>
          <p className="text-2xl font-bold">40 videos/day</p>
          <p className="text-sm mt-2">Up to 12 min · Recommended</p>
        </div>
      </section>
    </main>
  );
}
