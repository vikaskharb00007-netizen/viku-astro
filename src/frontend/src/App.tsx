import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import {
  RouterProvider,
  createBrowserHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import React from "react";
import BlogSection from "./components/BlogSection";
import ComparisonTable from "./components/ComparisonTable";
import Footer from "./components/Footer";
import Header from "./components/Header";
import HeroSection from "./components/HeroSection";
import NoticeBoardSection from "./components/NoticeBoardSection";
import ProfileSetupModal from "./components/ProfileSetupModal";
import ServiceGrid from "./components/ServiceGrid";
import ServicesSection from "./components/ServicesSection";
import SpecialUniqueServiceSection from "./components/SpecialUniqueServiceSection";
import VisitorQueryForm from "./components/VisitorQueryForm";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "./hooks/useQueries";
import AdminPage from "./pages/AdminPage";
import CoursesPage from "./pages/CoursesPage";
import HoraryPage from "./pages/HoraryPage";
import HoroscopePage from "./pages/HoroscopePage";
import NadiCardsPage from "./pages/NadiCardsPage";
import NumerologyPage from "./pages/NumerologyPage";
import PredictionDetailPage from "./pages/PredictionDetailPage";
import PredictionOptionsPage from "./pages/PredictionOptionsPage";

function HomePage() {
  const { identity } = useInternetIdentity();
  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched,
  } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;
  const showProfileSetup =
    isAuthenticated && !profileLoading && isFetched && userProfile === null;

  return (
    <div className="bg-background font-sans overflow-x-hidden w-full">
      <Header />
      <main className="overflow-x-hidden w-full">
        <HeroSection />

        {/* Service Grid */}
        <ServiceGrid />

        {/* Notice Board */}
        <NoticeBoardSection />

        {/* Visitor Query Section */}
        <section id="send-query" className="py-6 md:py-10 bg-white">
          <div className="max-w-xl mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-gray-800 mb-2">
                Send Us Your Query
              </h2>
              <p className="text-gray-500 text-sm md:text-base">
                Have a question? Fill out the form below and we will get back to
                you.
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8">
              <VisitorQueryForm />
            </div>
          </div>
        </section>

        <section id="special-services" className="py-10">
          <SpecialUniqueServiceSection />
        </section>
        <section id="services">
          <ServicesSection />
        </section>
        <section id="blog">
          <BlogSection />
        </section>
        <ComparisonTable />
      </main>

      <Footer />

      {showProfileSetup && <ProfileSetupModal />}
      <Toaster richColors position="top-right" />
    </div>
  );
}

const rootRoute = createRootRoute();
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});
const numerologyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/numerology",
  component: NumerologyPage,
});
const nadiCardsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/nadi-cards",
  component: NadiCardsPage,
});
const predictionOptionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/numerology/prediction",
  component: PredictionOptionsPage,
});
const predictionDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/numerology/prediction/$type",
  component: PredictionDetailPage,
});
const horoscopeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/horoscope",
  component: HoroscopePage,
});
const horaryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/horary",
  component: HoraryPage,
});
const coursesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/courses",
  component: CoursesPage,
});
const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  numerologyRoute,
  nadiCardsRoute,
  predictionOptionsRoute,
  predictionDetailRoute,
  horoscopeRoute,
  horaryRoute,
  coursesRoute,
  adminRoute,
]);
const history = createBrowserHistory();
const router = createRouter({ routeTree, history });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
