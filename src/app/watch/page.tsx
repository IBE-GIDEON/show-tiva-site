"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import styles from "./watch.module.css";

// Ultra High Resolution 4K Hero Slides matching CINEHD reference UI
const HERO_SLIDES = [
  {
    id: "spiderman",
    title: "SPIDER-MAN",
    subtitle: "BRAND NEW DAY",
    type: "Movie",
    rating: "9.8",
    year: "2026",
    description:
      "Fighting crime full-time as Spider-Man in a world that doesn't remember him—and the pressure of seeing his old friends move on without him—sparks a change in Peter Parker he may not have the power to control. But that...",
    image: "https://images.unsplash.com/photo-1635805737707-575885ab0820?q=90&w=1920&auto=format&fit=crop",
  },
  {
    id: "toy-story",
    title: "TOY STORY 5",
    subtitle: "WOODYS RETURN",
    type: "Movie",
    rating: "9.4",
    year: "2026",
    description:
      "Buzz, Woody, and the gang face a brand-new threat when tech toys take over playtime. Together, they embark on a heart-warming adventure to prove that real friendship never gets obsolete.",
    image: "https://images.unsplash.com/photo-1593085512500-5d55148d6f0d?q=90&w=1920&auto=format&fit=crop",
  },
  {
    id: "wall-e",
    title: "WALL.E",
    subtitle: "LAST ROBOT ON EARTH",
    type: "Movie",
    rating: "9.1",
    year: "2008",
    description:
      "In the year 2805, Earth is an uninhabitable wasteland abandoned by humanity due to overconsumption and garbage. WALL-E spends his days compacting trash and collecting trinkets until EVE arrives.",
    image: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?q=90&w=1920&auto=format&fit=crop",
  },
  {
    id: "kung-fu-panda",
    title: "KUNG FU PANDA 4",
    subtitle: "THE DRAGON WARRIOR",
    type: "Movie",
    rating: "8.9",
    year: "2024",
    description:
      "Po is tapped to become the Spiritual Leader of the Valley of Peace, but needs to find and train a new Dragon Warrior before he can assume his new lofty position.",
    image: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=90&w=1920&auto=format&fit=crop",
  },
];

// Peeking cards for bottom section of hero banner
const PEEKING_CARDS = [
  {
    id: "peek-1",
    title: "Spider-Man 2D",
    image: "https://images.unsplash.com/photo-1635805737707-575885ab0820?q=90&w=800&auto=format&fit=crop",
  },
  {
    id: "peek-2",
    title: "Toy Story 5",
    image: "https://images.unsplash.com/photo-1593085512500-5d55148d6f0d?q=90&w=800&auto=format&fit=crop",
  },
  {
    id: "peek-3",
    title: "Wall-E Art",
    image: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?q=90&w=800&auto=format&fit=crop",
  },
  {
    id: "peek-4",
    title: "Kung Fu Panda",
    image: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=90&w=800&auto=format&fit=crop",
  },
  {
    id: "peek-5",
    title: "Anime City",
    image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=90&w=800&auto=format&fit=crop",
  },
  {
    id: "peek-6",
    title: "Vector Star",
    image: "https://images.unsplash.com/photo-1500485035595-cbe6f645feb1?q=90&w=800&auto=format&fit=crop",
  },
];

// Expanded Movie Rows
const MOVIE_SECTIONS = [
  {
    id: "trending-now",
    title: "Trending Now",
    titleColor: "normal",
    movies: [
      { id: "t1", title: "Soul", image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600&auto=format&fit=crop", rating: "9.2", year: "2020" },
      { id: "t2", title: "Vivo", image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=600&auto=format&fit=crop", rating: "8.6", year: "2024" },
      { id: "t3", title: "Home", image: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=600&auto=format&fit=crop", rating: "8.1", year: "2025" },
      { id: "t4", title: "Luca", image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=600&auto=format&fit=crop", rating: "8.5", year: "2024" },
      { id: "t5", title: "Small Foot", image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=600&auto=format&fit=crop", rating: "7.9", year: "2020" },
      { id: "t6", title: "The Good Dinosaur", image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=600&auto=format&fit=crop", rating: "7.1", year: "2023" },
      { id: "t7", title: "Encanto", image: "https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?q=80&w=600&auto=format&fit=crop", rating: "8.2", year: "2022" },
      { id: "t8", title: "Raya & Last Dragon", image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop", rating: "7.5", year: "2021" },
      { id: "t9", title: "Onward", image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=600&auto=format&fit=crop", rating: "7.3", year: "2020" },
      { id: "t10", title: "Frozen II", image: "https://images.unsplash.com/photo-1491002052546-bf38f186af56?q=80&w=600&auto=format&fit=crop", rating: "8.0", year: "2019" },
    ],
  },
  {
    id: "movies",
    title: "Movies",
    titleColor: "yellow",
    movies: [
      { id: "m1", title: "The Good Dinosaur", image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=600&auto=format&fit=crop", rating: "7.1", year: "2023" },
      { id: "m2", title: "David", image: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?q=80&w=600&auto=format&fit=crop", rating: "8.8", year: "2026" },
      { id: "m3", title: "Wall-E", image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=600&auto=format&fit=crop", rating: "9.1", year: "2008" },
      { id: "m4", title: "Soul", image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600&auto=format&fit=crop", rating: "9.2", year: "2020" },
      { id: "m5", title: "Vivo", image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=600&auto=format&fit=crop", rating: "8.6", year: "2024" },
      { id: "m6", title: "Zootopia", image: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=600&auto=format&fit=crop", rating: "8.0", year: "2016" },
      { id: "m7", title: "Moana", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop", rating: "7.6", year: "2016" },
      { id: "m8", title: "Big Hero 6", image: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600&auto=format&fit=crop", rating: "7.8", year: "2014" },
      { id: "m9", title: "Wreck-It Ralph", image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600&auto=format&fit=crop", rating: "7.7", year: "2012" },
      { id: "m10", title: "Tangled", image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600&auto=format&fit=crop", rating: "7.7", year: "2010" },
    ],
  },
  {
    id: "cartoons-animation",
    title: "Cartoons & Animation",
    titleColor: "normal",
    movies: [
      { id: "c1", title: "Inside Out 2", image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=600&auto=format&fit=crop", rating: "8.1", year: "2024" },
      { id: "c2", title: "Moana 2", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop", rating: "7.8", year: "2024" },
      { id: "c3", title: "Across Spider-Verse", image: "https://images.unsplash.com/photo-1635805737707-575885ab0820?q=80&w=600&auto=format&fit=crop", rating: "8.7", year: "2023" },
      { id: "c4", title: "Elemental", image: "https://images.unsplash.com/photo-1509281373149-e957c6296406?q=80&w=600&auto=format&fit=crop", rating: "7.0", year: "2023" },
      { id: "c5", title: "Turning Red", image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop", rating: "7.0", year: "2022" },
      { id: "c6", title: "Puss in Boots", image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600&auto=format&fit=crop", rating: "7.9", year: "2022" },
      { id: "c7", title: "Sing 2", image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600&auto=format&fit=crop", rating: "7.4", year: "2021" },
      { id: "c8", title: "The Bad Guys", image: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=600&auto=format&fit=crop", rating: "6.8", year: "2022" },
      { id: "c9", title: "Minions: Rise of Gru", image: "https://images.unsplash.com/photo-1558877385-81a1c7e67d72?q=80&w=600&auto=format&fit=crop", rating: "6.5", year: "2022" },
      { id: "c10", title: "DC Super Pets", image: "https://images.unsplash.com/photo-1548247416-ec66f4900b2e?q=80&w=600&auto=format&fit=crop", rating: "7.2", year: "2022" },
    ],
  },
  {
    id: "wholesome-series",
    title: "Wholesome Series",
    titleColor: "yellow",
    aspect: "landscape",
    movies: [
      { id: "s1", title: "Bluey Adventures", image: "https://images.unsplash.com/photo-1537151608828-ea2b117b6b8a?q=80&w=600&auto=format&fit=crop", rating: "9.5", year: "2024" },
      { id: "s2", title: "Airbender Chronicles", image: "https://images.unsplash.com/photo-1542332213-9b5a5a3af302?q=80&w=600&auto=format&fit=crop", rating: "9.2", year: "2024" },
      { id: "s3", title: "Hilda Tales", image: "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=600&auto=format&fit=crop", rating: "8.6", year: "2023" },
      { id: "s4", title: "Gravity Falls", image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=600&auto=format&fit=crop", rating: "8.9", year: "2022" },
      { id: "s5", title: "DuckTales", image: "https://images.unsplash.com/photo-1473830394358-91588751b241?q=80&w=600&auto=format&fit=crop", rating: "8.2", year: "2023" },
      { id: "s6", title: "Kipo & Wonderbeasts", image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop", rating: "8.3", year: "2021" },
      { id: "s7", title: "She-Ra Legends", image: "https://images.unsplash.com/photo-1569003339405-ea396a5a8a90?q=80&w=600&auto=format&fit=crop", rating: "8.4", year: "2020" },
      { id: "s8", title: "Amphibia", image: "https://images.unsplash.com/photo-1500485035595-cbe6f645feb1?q=80&w=600&auto=format&fit=crop", rating: "8.1", year: "2022" },
      { id: "s9", title: "The Owl House", image: "https://images.unsplash.com/photo-1519074002996-a69e7ac46a42?q=80&w=600&auto=format&fit=crop", rating: "9.0", year: "2023" },
      { id: "s10", title: "Green Eggs & Ham", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=600&auto=format&fit=crop", rating: "8.2", year: "2022" },
    ],
  },
  {
    id: "new-release",
    title: "New Releases",
    titleColor: "normal",
    aspect: "landscape",
    movies: [
      { id: "nr1", title: "The Good Dinosaur", image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=600&auto=format&fit=crop", rating: "6.6", year: "2024" },
      { id: "nr2", title: "David", image: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?q=80&w=600&auto=format&fit=crop", rating: "6.6", year: "2026" },
      { id: "nr3", title: "Wall-E", image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=600&auto=format&fit=crop", rating: "6.6", year: "2023" },
      { id: "nr4", title: "Soul", image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600&auto=format&fit=crop", rating: "6.6", year: "2018" },
      { id: "nr5", title: "Vivo", image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=600&auto=format&fit=crop", rating: "6.6", year: "2024" },
      { id: "nr6", title: "Luca", image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=600&auto=format&fit=crop", rating: "7.5", year: "2024" },
      { id: "nr7", title: "Small Foot", image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=600&auto=format&fit=crop", rating: "6.6", year: "2020" },
      { id: "nr8", title: "Home", image: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=600&auto=format&fit=crop", rating: "6.6", year: "2025" },
      { id: "nr9", title: "Encanto", image: "https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?q=80&w=600&auto=format&fit=crop", rating: "8.2", year: "2022" },
      { id: "nr10", title: "Frozen II", image: "https://images.unsplash.com/photo-1491002052546-bf38f186af56?q=80&w=600&auto=format&fit=crop", rating: "8.0", year: "2019" },
      { id: "nr11", title: "Onward", image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=600&auto=format&fit=crop", rating: "7.3", year: "2020" },
      { id: "nr12", title: "Zootopia", image: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=600&auto=format&fit=crop", rating: "8.0", year: "2016" },
    ],
  },
  {
    id: "magical-fantasy",
    title: "Magical Worlds & Fantasy",
    titleColor: "yellow",
    movies: [
      { id: "mf1", title: "Chronicles of Magic", image: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=600&auto=format&fit=crop", rating: "8.7", year: "2025" },
      { id: "mf2", title: "The Wizard Library", image: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=600&auto=format&fit=crop", rating: "8.3", year: "2024" },
      { id: "mf3", title: "Elf Woods", image: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=600&auto=format&fit=crop", rating: "8.9", year: "2023" },
      { id: "mf4", title: "Castle in the Air", image: "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?q=80&w=600&auto=format&fit=crop", rating: "9.0", year: "2026" },
      { id: "mf5", title: "Unicorn Kingdom", image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop", rating: "7.9", year: "2022" },
      { id: "mf6", title: "Spirited Meadow", image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=600&auto=format&fit=crop", rating: "8.6", year: "2021" },
      { id: "mf7", title: "The Floating Island", image: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?q=80&w=600&auto=format&fit=crop", rating: "8.5", year: "2024" },
      { id: "mf8", title: "Lost Temple", image: "https://images.unsplash.com/photo-1542397284385-601017642475?q=80&w=600&auto=format&fit=crop", rating: "8.1", year: "2023" },
      { id: "mf9", title: "Guardian of Forest", image: "https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=600&auto=format&fit=crop", rating: "8.7", year: "2024" },
      { id: "mf10", title: "Aurora Borealis", image: "https://images.unsplash.com/photo-1482862549707-f63cb32c5fd9?q=80&w=600&auto=format&fit=crop", rating: "9.2", year: "2023" },
      { id: "mf11", title: "Ancient Runes", image: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=600&auto=format&fit=crop", rating: "7.9", year: "2022" },
      { id: "mf12", title: "Celestial Skies", image: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=600&auto=format&fit=crop", rating: "9.1", year: "2026" },
    ],
  },
  {
    id: "action-adventure",
    title: "Action & Adventure",
    titleColor: "normal",
    aspect: "landscape",
    movies: [
      { id: "aa1", title: "Speed Racer", image: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=600&auto=format&fit=crop", rating: "8.4", year: "2024" },
      { id: "aa2", title: "Mountain Rescue", image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=600&auto=format&fit=crop", rating: "8.1", year: "2023" },
      { id: "aa3", title: "Island Explorer", image: "https://images.unsplash.com/photo-1505142468610-359e7d316be0?q=80&w=600&auto=format&fit=crop", rating: "8.5", year: "2025" },
      { id: "aa4", title: "Cosmic Odyssey", image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop", rating: "9.3", year: "2026" },
      { id: "aa5", title: "Viking Legends", image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop", rating: "7.8", year: "2022" },
      { id: "aa6", title: "Treasure Quest", image: "https://images.unsplash.com/photo-1473830394358-91588751b241?q=80&w=600&auto=format&fit=crop", rating: "8.2", year: "2021" },
      { id: "aa7", title: "Desert Rider", image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=600&auto=format&fit=crop", rating: "8.0", year: "2023" },
      { id: "aa8", title: "Deep Sea Hunt", image: "https://images.unsplash.com/photo-1582967788606-a171c1080cb0?q=80&w=600&auto=format&fit=crop", rating: "7.9", year: "2024" },
      { id: "aa9", title: "Cyber Chaser", image: "https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?q=80&w=600&auto=format&fit=crop", rating: "8.6", year: "2025" },
      { id: "aa10", title: "Sky Cruiser", image: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=600&auto=format&fit=crop", rating: "9.0", year: "2026" },
      { id: "aa11", title: "Storm Tracker", image: "https://images.unsplash.com/photo-1527489377706-5bf97e608852?q=80&w=600&auto=format&fit=crop", rating: "7.7", year: "2022" },
      { id: "aa12", title: "Wilderness Path", image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=600&auto=format&fit=crop", rating: "8.3", year: "2023" },
    ],
  },
];

// Per-section heading accent colors (cycled by index)
const SECTION_ACCENTS = ["#ff5964", "#4c8dff", "#b06bff", "#22c1a4", "#f5a524", "#ff6b9d", "#5ec26a"];

export default function WatchPage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [prevSlide, setPrevSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [bookmarked, setBookmarked] = useState<{ [key: string]: boolean }>({});
  const [themeDark, setThemeDark] = useState(true);

  const [hoveredMovie, setHoveredMovie] = useState<any | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number; alignRight: boolean; height: number } | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getMovieDesc = (title: string) => {
    const descs: Record<string, string> = {
      "Soul": "A New York jazz pianist finds himself in a cosmic realm between life and death, discovering the true meaning of having a soul.",
      "Vivo": "A music-loving kinkajou embarks on a thrilling musical adventure from Havana to Miami to deliver a sacred love song.",
      "Home": "An adorable misfit alien named Oh accidentally alerts his enemies to his location on Earth, teaming up with an adventurous girl.",
      "Luca": "On the Italian Riviera, an unlikely friendship grows between a young human boy and a sea monster disguised as a human.",
      "Small Foot": "A bright young Yeti finds something he thought didn't exist—a human—sparking wild rumors and adventure in his snowy village.",
      "The Good Dinosaur": "In a world where dinosaurs never went extinct, an Arpatosaurus named Arlo makes an unlikely human friend named Spot.",
      "Encanto": "In a magical house in Colombia, Mirabel, the only member of her family without magical powers, must save their fading magic.",
      "Raya & Last Dragon": "In Kumandra, a lone warrior princess must track down the legendary last dragon to restore peace and stop ancient monsters.",
      "Onward": "Two elf brothers embark on an extraordinary quest to discover if there is still a little magic left in the modern world.",
      "Frozen II": "Elsa travels to an ancient, autumn-bound forest to find the origin of her powers and save her kingdom of Arendelle.",
      "David": "An epic animated historical journey detailing the courage, trials, and triumphs of the legendary shepherd boy who became king.",
      "Wall-E": "A lonely trash-compacting robot on a deserted future Earth embarks on a space journey that will decide the fate of mankind.",
      "Zootopia": "In a city of anthropomorphic predators and prey, a rookie bunny cop and a cynical con artist fox team up to solve a conspiracy.",
      "Moana": "An adventurous teenager sails out on a daring mission to save her people, meeting the mighty demigod Maui along the way.",
      "Big Hero 6": "A robotics prodigy and his inflatable healthcare robot Baymax form a band of high-tech heroes to combat a masked villain.",
      "Wreck-It Ralph": "An arcade game villain rebels against his role and travels through other games to prove he has what it takes to be a hero.",
      "Tangled": "The magically long-haired Rapunzel escapes her tower with the help of a charming thief to see the floating lanterns.",
      "Inside Out 2": "Joy, Sadness, Anger, Fear and Disgust face new challenges inside teenage Riley's mind when Anxiety and new emotions arrive.",
      "Moana 2": "Moana receives an unexpected call from her wayfinding ancestors, embarking on an epic voyage to the far seas of Oceania.",
      "Across Spider-Verse": "Miles Morales catapults across the Multiverse, encountering a team of Spider-People charged with protecting its existence.",
      "Elemental": "In a city where fire, water, land, and air residents live together, a fiery young woman and a go-with-the-flow guy discover a connection.",
      "Turning Red": "A confident, dorky thirteen-year-old girl named Mei Lee faces the ultimate challenge of turning into a giant red panda when excited.",
      "Puss in Boots": "The daring outlaw Puss in Boots discovers his passion for adventure has taken its toll, setting out on a quest to restore his nine lives.",
      "Sing 2": "Buster Moon and his all-star cast of performers prepare to launch their most dazzling stage extravaganza yet in the entertainment capital.",
      "The Bad Guys": "A crew of clever animal outlaws attempt their most challenging con yet: becoming model citizens to avoid prison.",
      "Minions: Rise of Gru": "The untold story of a twelve-year-old's dream to become the world's greatest supervillain, aided by his mischievous Minions.",
      "DC Super Pets": "Krypto the Super-Dog must convince a ragtag pack of shelter animals to master their own powers to help rescue the Justice League.",
      "Bluey Adventures": "Follow the lovable and inexhaustible six-year-old Bluey dog, who turns everyday family life into extraordinary adventures.",
      "Airbender Chronicles": "A young boy chosen as the Avatar must master the four elements to save a war-torn world and restore global harmony.",
      "Hilda Tales": "A fearless, blue-haired girl travels from her wilderness home to the bustling city of Trolberg, encountering magical creatures.",
      "Gravity Falls": "Twin siblings Dipper and Mabel spend the summer with their eccentric great-uncle in a mysterious town full of paranormal secrets.",
      "DuckTales": "The globetrotting adventures of billionaire Scrooge McDuck and his mischief-making grandnephews Huey, Dewey, and Louie.",
      "Kipo & Wonderbeasts": "A sheltered girl escapes an underground city and navigates a vibrant, post-apocalyptic surface world populated by mutant animals.",
      "She-Ra Legends": "An orphan girl discovers a magic sword that transforms her into the legendary warrior princess She-Ra, leading a rebellion.",
      "Amphibia": "An ordinary teenager is magically transported to a wild marshland world populated by talking frog-people, learning true friendship.",
      "The Owl House": "A self-assured human teenager accidentally stumbles upon a portal to a magical new world, training as a witch's apprentice.",
      "Green Eggs & Ham": "An unlikely duo embarks on a cross-country road trip to save an endangered animal, learning to try new things along the way.",
      "Chronicles of Magic": "A mesmerizing fantasy series detailing the hidden academies, secret spellbound keys, and ancient wizardry of the far realm.",
      "The Wizard Library": "A quiet archivist discovers a forbidden portal inside the grand library, unleashing forgotten magic into the empire.",
      "Elf Woods": "Journey deep into the enchanted forest where elven factions guard the sacred silver trees from an encroaching dark spell.",
      "Castle in the Air": "Floating high above the clouds, a majestic kingdom powered by wind and ancient machinery faces a sudden rebellion.",
      "Unicorn Kingdom": "A young explorer ventures into the mystical valley of the horned beasts to retrieve the star stone and restore their light.",
      "Spirited Meadow": "A soft-hued pastoral fantasy following woodland spirits as they prepare the forest floor for the coming winter solstice.",
      "The Floating Island": "An adventurer lands on a massive flying island, discovering gravity-defying waterfalls and mythical flying creatures.",
      "Lost Temple": "A daring archaeologist deciphers ancient stone carvings to uncover a forgotten sanctuary containing infinite power.",
      "Guardian of Forest": "A giant, peaceful stone golem awakes from a centuries-long slumber to protect the valley from a sudden threat.",
      "Aurora Borealis": "A mystical tale of a young starcatcher who travels to the frozen edge of the world to collect the dancing green lights.",
      "Ancient Runes": "A teenage scholar accidentally activates a runic circle, opening a doorway to prehistoric realms.",
      "Celestial Skies": "An ethereal voyage through the constellations where starships are guided by living celestial whales and starlight.",
      "Speed Racer": "A high-octane racing prodigy competes in lethal futuristic tournaments to uncover the truth behind his brother's disappearance.",
      "Mountain Rescue": "An elite team of climbing rangers brave extreme blizzards and treacherous avalanches to save stranded explorers.",
      "Island Explorer": "A shipwrecked voyager charts a mysterious tropical island filled with hidden grottos, active volcanoes, and ancient relics.",
      "Cosmic Odyssey": "A pioneer astronaut crew travels beyond the edge of the known universe, encountering anomalies and strange landscapes.",
      "Viking Legends": "Follow a young Norse chieftain as he sails across uncharted northern seas to discover new lands and forge peace.",
      "Treasure Quest": "An intrepid group of treasure hunters deciphers a centuries-old map to locate the golden city hidden inside the jungle.",
      "Desert Rider": "A lone motorcycle racer travels across endless post-apocalyptic sand dunes, dodging raiders and sandstorms.",
      "Deep Sea Hunt": "A marine biologist piloting a deep-sea submersible discovers a glowing bioluminescent trench filled with leviathans.",
      "Cyber Chaser": "In a neon-drenched cyberpunk metropolis, a rogue hacker flees from corporate agents who seek a AI chip.",
      "Sky Cruiser": "A sky-pirate captain navigates his airship through storms to steal a floating island's power core.",
      "Storm Tracker": "A team of daring meteorologists chases giant category-five superstorms to gather data and save coastal towns.",
      "Wilderness Path": "A quiet, beautiful journey following a young survivalist who hikes across the rugged ranges."
    };
    return descs[title] || "An exciting cinematic story filled with unforgettable characters, gorgeous hand-drawn animation, and thrilling adventure.";
  };

  const handleCardMouseEnter = (movie: any, e: React.MouseEvent) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    const rect = e.currentTarget.getBoundingClientRect();
    
    const popoverWidth = 330;
    const gap = 12; // Restore original space between card and popover
    
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const scrollX = window.scrollX || document.documentElement.scrollLeft;
    
    let left = rect.right + gap + scrollX;
    let alignRight = true;
    
    if (rect.right + gap + popoverWidth > window.innerWidth) {
      left = rect.left - popoverWidth - gap + scrollX;
      alignRight = false;
    }
    
    if (left < 0) left = 12;
    const top = rect.top + scrollY;

    setPopoverPos({ 
      top, 
      left, 
      alignRight, 
      height: rect.height 
    });
    setHoveredMovie(movie);
  };

  const handleCardMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredMovie(null);
      setPopoverPos(null);
    }, 200);
  };

  const handlePopoverMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
  };

  const handlePopoverMouseLeave = () => {
    setHoveredMovie(null);
    setPopoverPos(null);
  };

  // Auto-advance hero slides every 7 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      triggerSlideChange((activeSlide + 1) % HERO_SLIDES.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [activeSlide]);

  const triggerSlideChange = (newIndex: number) => {
    if (newIndex === activeSlide) return;
    setPrevSlide(activeSlide);
    setActiveSlide(newIndex);
    setIsTransitioning(true);

    setTimeout(() => {
      setIsTransitioning(false);
    }, 1200); // matches CSS transition duration
  };

  const toggleBookmark = (movieId: string) => {
    setBookmarked((prev) => ({ ...prev, [movieId]: !prev[movieId] }));
  };

  const scrollRow = (e: React.MouseEvent<HTMLButtonElement>, direction: number) => {
    const section = (e.currentTarget as HTMLElement).closest("section");
    const row = section?.querySelector<HTMLElement>(`.${styles.posterRow}`);
    if (row) row.scrollBy({ left: direction * row.clientWidth * 0.85, behavior: "smooth" });
  };

  const currentSlide = HERO_SLIDES[activeSlide];

  return (
    <div className={`${styles.watchContainer} ${themeDark ? styles.darkTheme : styles.lightTheme}`}>
      <header className={styles.topNavbar}>
        <div className={styles.navbarInner}>
          {/* Brand Logo */}
          <Link href="/" className={styles.brandLogo}>
            <span className={styles.showText}>SHOW</span>
            <span className={styles.tivaText}>TIVA</span>
          </Link>
        </div>
      </header>

      {/* 100vh Fullscreen Hero Section */}
      <section className={styles.fullscreenHero}>
        {/* Continuous Stacked 4K Image Crossfade Engine (Prevents any black point) */}
        {HERO_SLIDES.map((slide, index) => {
          const isActive = index === activeSlide;
          const isPrevious = index === prevSlide && isTransitioning;

          let slideClass = styles.heroSlideHidden;
          if (isActive) slideClass = styles.heroSlideActive;
          else if (isPrevious) slideClass = styles.heroSlidePrevious;

          return (
            <div
              key={slide.id}
              className={`${styles.heroSlide} ${slideClass}`}
            >
              <img
                src={slide.image}
                alt={slide.title}
                className={styles.backdropImage}
              />
            </div>
          );
        })}

        {/* Dark Vignette Overlay */}
        <div className={styles.vignetteOverlay} />

      </section>

      {/* Main Browse Catalog Below Hero */}
      <main className={styles.watchMain}>
        {MOVIE_SECTIONS.map((section, index) => {
          const accent = SECTION_ACCENTS[index % SECTION_ACCENTS.length];

          return (
            <section key={section.id} id={section.id} className={styles.movieSection}>
              {/* Section Header */}
              <div className={styles.sectionHeaderRow}>
                <div className={styles.sectionTitleWrap}>
                  <h2 className={styles.sectionTitle} style={{ color: accent }}>
                    {section.title}
                  </h2>
                  <span className={styles.headerDivider} />
                  <button className={styles.viewAllLink}>View All</button>
                </div>

                <div className={styles.carouselArrows}>
                  <button
                    className={styles.arrowBtn}
                    aria-label="Scroll left"
                    onClick={(e) => scrollRow(e, -1)}
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                  <button
                    className={styles.arrowBtn}
                    aria-label="Scroll right"
                    onClick={(e) => scrollRow(e, 1)}
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Poster Row */}
              <div className={styles.posterRow}>
                {section.movies.map((movie) => {
                  const isLandscape = section.aspect === "landscape";
                  const isSaved = !!bookmarked[movie.id];
                  return (
                    <div
                      key={movie.id}
                      className={isLandscape ? styles.posterCardLandscape : styles.posterCard}
                      onMouseEnter={(e) => handleCardMouseEnter(movie, e)}
                      onMouseLeave={handleCardMouseLeave}
                    >
                      <div className={isLandscape ? styles.posterWrapperLandscape : styles.posterWrapper}>
                        <img
                          src={movie.image}
                          alt={movie.title}
                          loading="lazy"
                          className={styles.posterImg}
                        />

                        {/* Bookmark / Save (top-left) */}
                        <button
                          className={`${styles.bookmarkBtn} ${isSaved ? styles.bookmarkActive : ""}`}
                          aria-label="Save to list"
                          onClick={() => toggleBookmark(movie.id)}
                        >
                          <svg viewBox="0 0 24 24" width="15" height="15" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                          </svg>
                        </button>

                        {/* Rating badge (top-right) */}
                        <div className={styles.ratingBadge}>
                          <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                          <span>{movie.rating}</span>
                        </div>

                        {/* Hover play button */}
                        <div className={styles.posterOverlay}>
                          <div className={styles.playBtnCircle}>
                            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>

                        {/* Title / year revealed on hover */}
                        <div className={styles.posterHoverInfo}>
                          <h4 className={styles.posterTitle}>{movie.title}</h4>
                          <span className={styles.metaYear}>{movie.year}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </main>

      {/* Premium Cinematic Footer with Blurred Movie Backdrop */}
      <footer className={styles.watchFooter}>
        <div className={styles.footerBgWrap}>
          <img 
            src="https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=1200&auto=format&fit=crop" 
            alt="Footer Background" 
            className={styles.footerBgImage} 
          />
          <div className={styles.footerVignette} />
        </div>

        <div className={styles.footerContent}>
          <div className={styles.footerTop}>
            {/* Branding Column */}
            <div className={styles.footerBrandCol}>
              <div className={styles.footerLogo}>
                <span className={styles.showText}>SHOW</span>
                <span className={styles.tivaText}>TIVA</span>
              </div>
              <p className={styles.footerTagline}>
                Experience premium stories, hand-drawn 2D animation, and magical worlds curated by creators worldwide.
              </p>
            </div>

            {/* Quick Link Columns */}
            <div className={styles.footerLinksGrid}>
              <div className={styles.footerLinksCol}>
                <h5 className={styles.footerColTitle}>Explore</h5>
                <ul className={styles.footerLinksList}>
                  <li><a href="#trending-now">Trending Now</a></li>
                  <li><a href="#movies">Popular Movies</a></li>
                  <li><a href="#wholesome-series">Wholesome Series</a></li>
                  <li><a href="#new-release">New Releases</a></li>
                </ul>
              </div>

              <div className={styles.footerLinksCol}>
                <h5 className={styles.footerColTitle}>Company</h5>
                <ul className={styles.footerLinksList}>
                  <li><a href="#">About Us</a></li>
                  <li><a href="#">Careers</a></li>
                  <li><a href="#">Press Kit</a></li>
                  <li><a href="#">Contact</a></li>
                </ul>
              </div>

              <div className={styles.footerLinksCol}>
                <h5 className={styles.footerColTitle}>Legal</h5>
                <ul className={styles.footerLinksList}>
                  <li><a href="#">Terms of Use</a></li>
                  <li><a href="#">Privacy Policy</a></li>
                  <li><a href="#">Cookie Preferences</a></li>
                  <li><a href="#">Ad Choices</a></li>
                </ul>
              </div>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <p className={styles.footerCopyright}>
              &copy; {new Date().getFullYear()} SHOWTIVA. All rights reserved. Crafted for film lovers.
            </p>
            <div className={styles.footerSocials}>
              <a href="#" className={styles.socialIconLink} aria-label="Twitter">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
                </svg>
              </a>
              <a href="#" className={styles.socialIconLink} aria-label="Instagram">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a href="#" className={styles.socialIconLink} aria-label="YouTube">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
                  <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Dynamic Cinematic Detail Popover Card (Portal-style floating popup next to hovered card) */}
      {hoveredMovie && popoverPos && (
        <div
          className={`${styles.detailsPopover} ${popoverPos.alignRight ? styles.popoverRight : styles.popoverLeft}`}
          style={{
            top: `${popoverPos.top}px`,
            left: `${popoverPos.left}px`,
            width: '330px',
            height: `${popoverPos.height}px`,
          }}
          onMouseEnter={handlePopoverMouseEnter}
          onMouseLeave={handlePopoverMouseLeave}
        >
          {/* Backdrop Header Image */}
          <div className={styles.popoverBackdropWrap}>
            <img 
              src={hoveredMovie.image} 
              alt={hoveredMovie.title} 
              className={styles.popoverBackdrop} 
            />
            <div className={styles.popoverBackdropVignette} />
            
            {/* Logo/Subtitle inside Backdrop */}
            <div className={styles.popoverBackdropText}>
              <h3 className={styles.popoverLogoTitle}>{hoveredMovie.title}</h3>
              <div className={styles.popoverMetaRowInline}>
                <span className={styles.popoverTypeBadge}>Tv</span>
                <span className={styles.popoverRatingInline}>★ {hoveredMovie.rating}</span>
                <span className={styles.popoverYearInline}>📅 {hoveredMovie.year}</span>
                <span className={styles.popoverLangInline}>EN</span>
              </div>
            </div>

            {/* Top-Right Badge */}
            <div className={styles.popoverTopRightBadge}>
              <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span>{hoveredMovie.rating}</span>
            </div>
          </div>

          {/* Details Body */}
          <div className={styles.popoverBody}>
            <h4 className={styles.popoverTitle}>{hoveredMovie.title}</h4>
            <p className={styles.popoverDescription}>
              {getMovieDesc(hoveredMovie.title)}
            </p>

            {/* Button Actions */}
            <div className={styles.popoverActions}>
              <button className={styles.popoverWatchBtn}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                <span>Watch Now</span>
              </button>
              
              <button 
                className={`${styles.popoverPlusBtn} ${bookmarked[hoveredMovie.id] ? styles.popoverPlusActive : ""}`}
                onClick={() => toggleBookmark(hoveredMovie.id)}
                aria-label="Add to Watchlist"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  {bookmarked[hoveredMovie.id] ? (
                    <polyline points="20 6 9 17 4 12" />
                  ) : (
                    <>
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </>
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
