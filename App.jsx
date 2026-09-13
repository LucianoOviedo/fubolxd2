import React, { useState, useEffect, useCallback } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithCustomToken,
  signInAnonymously,
  onAuthStateChanged
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot
} from "firebase/firestore";
import {
  Star, Trophy, Plus, Search, X, UserCircle2,
  MessageCircle, Trash2, Home as HomeIcon, BookOpen,
  Award, Heart, LogOut, Lock, User, Key, Cloud, Users
} from "lucide-react";

const appId = typeof __app_id !== "undefined" ? __app_id : "fubolxd-app";

const firebaseConfig = {
  apiKey: "AIzaSyB6_EJT6PcOeORUxJjmUAwIN4RiCPsRtLk",
  authDomain: "fubolxd2.firebaseapp.com",
  databaseURL: "https://fubolxd2-default-rtdb.firebaseio.com",
  projectId: "fubolxd2",
  storageBucket: "fubolxd2.firebasestorage.app",
  messagingSenderId: "64131098050",
  appId: "1:64131098050:web:5d4339b4a601ea968b225b"
};

const firebaseConfig =
  typeof __firebase_config !== "undefined"
    ? typeof __firebase_config === "string"
      ? JSON.parse(__firebase_config)
      : __firebase_config
    : defaultFirebaseConfig;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const AVATARS = ["⚽", "🧤", "🏆", "🟨", "🧣", "📣", "🥅", "🟥", "🔥", "⚡"];

const seedUsers = [
  { id: "u-fede", name: "Fede", password: "123", emoji: "🧣", favoriteTeam: "River Plate" },
  { id: "u-cami", name: "Cami", password: "123", emoji: "🏆", favoriteTeam: "Argentina" },
  { id: "u-naza", name: "Naza", password: "123", emoji: "📣", favoriteTeam: "Boca Juniors" }
];

const seedMatches = [
  { id: "m1", teamA: "Argentina", teamB: "Francia", golesA: 3, golesB: 3, penales: "4-2", competition: "Final, Mundial Qatar 2022", date: "2022-12-18", venue: "Estadio Lusail" },
  { id: "m2", teamA: "River Plate", teamB: "Boca Juniors", golesA: 3, golesB: 1, competition: "Final, Copa Libertadores 2018", date: "2018-12-09", venue: "Santiago Bernabéu" },
  { id: "m3", teamA: "Liverpool", teamB: "AC Milan", golesA: 3, golesB: 3, penales: "3-2", competition: "Final, Champions League 2005", date: "2005-05-25", venue: "Estadio Olímpico Atatürk" },
  { id: "m4", teamA: "Brasil", teamB: "Alemania", golesA: 1, golesB: 7, competition: "Semifinal, Mundial 2014", date: "2014-07-08", venue: "Estadio Mineirão" },
  { id: "m5", teamA: "Real Madrid", teamB: "FC Barcelona", golesA: 2, golesB: 3, competition: "LaLiga 2016/17", date: "2017-04-23", venue: "Santiago Bernabéu" }
];

const seedReviews = [
  { id: "r1", userId: "u-fede", matchId: "m1", rating: 5, text: "Lo vi con mi viejo. No me voy a recuperar nunca de la atajada de Dibu a Kolo Muani en el 123'. Épico total.", mvp: "Lionel Messi", locationType: "En casa", watchedDate: "2022-12-18", createdAt: 1671350400000, likes: ["u-cami", "u-naza"] },
  { id: "r2", userId: "u-cami", matchId: "m3", rating: 5, text: "0-3 al entretiempo y me fui a hacer la cena. Vuelvo y estaba 3-3. El Milagro de Estambul en estado puro.", mvp: "Steven Gerrard", locationType: "En casa", watchedDate: "2023-01-02", createdAt: 1672617600000, likes: ["u-fede"] },
  { id: "r3", userId: "u-naza", matchId: "m2", rating: 4, text: "Rara la sensación de ver la final en Madrid, pero la corrida del Pity sobre el final quedó marcada para siempre.", mvp: "Juan Fernando Quintero", locationType: "En la cancha", watchedDate: "2018-12-09", createdAt: 1544313600000, likes: [] }
];

const seedFriendships = [
  { id: "f-1", followerId: "u-fede", followingId: "u-cami" },
  { id: "f-2", followerId: "u-cami", followingId: "u-naza" },
  { id: "f-3", followerId: "u-naza", followingId: "u-fede" }
];

function uid(prefix) {
  return prefix + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });
}

function scoreLabel(m) {
  return `${m.golesA} - ${m.golesB}` + (m.penales ? ` (${m.penales} pen.)` : "");
}

function StarRating({ rating, size = 16, onRate }) {
  return (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((n) => {
        const isFilled = n <= rating;
        if (onRate) {
          return (
            <button
              key={n}
              type="button"
              onClick={() => onRate(n)}
              className="cursor-pointer hover:scale-110 transition-transform focus:outline-none p-0.5"
              aria-label={`Calificar ${n} de 5 estrellas`}
            >
              <Star
                size={size}
                className={isFilled ? "text-amber-400" : "text-slate-600"}
                fill={isFilled ? "currentColor" : "none"}
              />
            </button>
          );
        }
        return (
          <span key={n} className="inline-flex items-center p-0.5">
            <Star
              size={size}
              className={isFilled ? "text-amber-400" : "text-slate-600"}
              fill={isFilled ? "currentColor" : "none"}
            />
          </span>
        );
      })}
    </div>
  );
}

function Avatar({ user, size = 40 }) {
  return (
    <div
      className="rounded-full bg-slate-800 border-2 border-emerald-500/40 flex items-center justify-center flex-shrink-0 shadow-inner"
      style={{ width: size, height: size, fontSize: size * 0.5 }}
    >
      {user.emoji || "⚽"}
    </div>
  );
}

function MatchScoreBadge({ match, size = "text-base" }) {
  const isDraw = match.golesA === match.golesB;
  const winnerA = match.golesA > match.golesB;

  return (
    <div className="flex items-center justify-between gap-2 w-full">
      <span className={`flex-1 text-right font-bold truncate ${winnerA ? "text-emerald-400" : "text-slate-200"}`}>
        {match.teamA}
      </span>
      <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wider shadow-md bg-slate-800 text-emerald-400 border border-emerald-500/30 whitespace-nowrap ${size}`}>
        {scoreLabel(match)}
      </span>
      <span className={`flex-1 text-left font-bold truncate ${!isDraw && !winnerA ? "text-emerald-400" : "text-slate-200"}`}>
        {match.teamB}
      </span>
    </div>
  );
}

export default function App() {
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(true);

  const [users, setUsers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [friendships, setFriendships] = useState([]);
  const [activeUserId, setActiveUserId] = useState(() => {
    try { return localStorage.getItem("fubx-active-user-id"); } catch (e) { return null; }
  });

  const [tab, setTab] = useState("inicio");
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [showAddMatch, setShowAddMatch] = useState(false);
  const [matchQuery, setMatchQuery] = useState("");

  // Autenticación inicial obligatoria
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== "undefined" && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth init error:", err);
        try { await signInAnonymously(auth); } catch (e) {}
      }
    };
    initAuth();

    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        setAuthReady(true);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!authReady || !auth.currentUser) return;

    const usersCol = collection(db, "artifacts", appId, "public", "data", "users");
    const matchesCol = collection(db, "artifacts", appId, "public", "data", "matches");
    const reviewsCol = collection(db, "artifacts", appId, "public", "data", "reviews");
    const friendshipsCol = collection(db, "artifacts", appId, "public", "data", "friendships");

    const unsubUsers = onSnapshot(usersCol, (snapshot) => {
      if (snapshot.empty) {
        seedUsers.forEach((u) => setDoc(doc(db, "artifacts", appId, "public", "data", "users", u.id), u));
      } else {
        setUsers(snapshot.docs.map((d) => d.data()));
      }
    }, (err) => console.error("Users error:", err));

    const unsubMatches = onSnapshot(matchesCol, (snapshot) => {
      if (snapshot.empty) {
        seedMatches.forEach((m) => setDoc(doc(db, "artifacts", appId, "public", "data", "matches", m.id), m));
      } else {
        setMatches(snapshot.docs.map((d) => d.data()));
      }
    }, (err) => console.error("Matches error:", err));

    const unsubReviews = onSnapshot(reviewsCol, (snapshot) => {
      if (snapshot.empty) {
        seedReviews.forEach((r) => setDoc(doc(db, "artifacts", appId, "public", "data", "reviews", r.id), r));
      } else {
        setReviews(snapshot.docs.map((d) => d.data()));
      }
    }, (err) => console.error("Reviews error:", err));

    const unsubFriendships = onSnapshot(friendshipsCol, (snapshot) => {
      if (snapshot.empty) {
        seedFriendships.forEach((f) => setDoc(doc(db, "artifacts", appId, "public", "data", "friendships", f.id), f));
      } else {
        setFriendships(snapshot.docs.map((d) => d.data()));
      }
      setLoading(false);
    }, (err) => console.error("Friendships error:", err));

    return () => {
      unsubUsers();
      unsubMatches();
      unsubReviews();
      unsubFriendships();
    };
  }, [authReady]);

  const setActive = useCallback((id) => {
    setActiveUserId(id);
    try {
      if (id) localStorage.setItem("fubx-active-user-id", id);
      else localStorage.removeItem("fubx-active-user-id");
    } catch (e) {}
  }, []);

  const me = users.find((u) => u.id === activeUserId) || null;

  const handleRegisterUser = async (newUser) => {
    if (!auth.currentUser) return;
    await setDoc(doc(db, "artifacts", appId, "public", "data", "users", newUser.id), newUser);
    setActive(newUser.id);
  };

  const handleAddMatch = async (newMatch) => {
    if (!auth.currentUser) return;
    await setDoc(doc(db, "artifacts", appId, "public", "data", "matches", newMatch.id), newMatch);
  };

  const handleSaveReview = async (rev) => {
    if (!auth.currentUser) return;
    await setDoc(doc(db, "artifacts", appId, "public", "data", "reviews", rev.id), rev);
  };

  const handleDeleteReview = async (reviewId) => {
    if (!auth.currentUser) return;
    await deleteDoc(doc(db, "artifacts", appId, "public", "data", "reviews", reviewId));
  };

  const toggleLike = async (reviewId) => {
    if (!me || !auth.currentUser) return;
    const targetRev = reviews.find((r) => r.id === reviewId);
    if (!targetRev) return;

    const likes = targetRev.likes || [];
    const has = likes.includes(me.id);
    const updatedLikes = has ? likes.filter((id) => id !== me.id) : [...likes, me.id];

    await setDoc(doc(db, "artifacts", appId, "public", "data", "reviews", reviewId), {
      ...targetRev,
      likes: updatedLikes
    });
  };

  const toggleFollow = async (targetId, isFollowing) => {
    if (!me || !auth.currentUser) return;
    const friendshipId = `f_${me.id}_${targetId}`;

    if (isFollowing) {
      await deleteDoc(doc(db, "artifacts", appId, "public", "data", "friendships", friendshipId));
    } else {
      await setDoc(doc(db, "artifacts", appId, "public", "data", "friendships", friendshipId), {
        id: friendshipId,
        followerId: me.id,
        followingId: targetId
      });
    }
  };

  if (loading || !authReady) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-emerald-500 font-sans">
        <div className="text-6xl animate-bounce mb-4">⚽</div>
        <h2 className="text-xl font-bold tracking-wide">Conectando a Fubolxd en vivo...</h2>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen font-sans flex flex-col selection:bg-emerald-500 selection:text-slate-950">
      {!me ? (
        <AuthScreen
          users={users}
          onLogin={(user) => setActive(user.id)}
          onRegister={handleRegisterUser}
        />
      ) : (
        <>
          {/* Header */}
          <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚽</span>
              <span className="text-2xl font-black bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent tracking-tight">
                Fubolxd
              </span>
              <span className="hidden sm:flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold ml-2">
                <Cloud size={10} /> Base de datos global
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 rounded-full pl-1.5 pr-3 py-1">
                <Avatar user={me} size={24} />
                <span className="text-xs font-semibold text-slate-200">{me.name}</span>
              </div>
              <button
                onClick={() => setActive(null)}
                className="flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full px-3 py-1.5 transition text-xs font-semibold cursor-pointer"
                title="Cerrar sesión"
              >
                <LogOut size={13} />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </header>

          {/* Navegación */}
          <nav className="sticky top-[57px] z-30 bg-slate-900 border-b border-slate-800 px-3 py-2 flex justify-center gap-1 sm:gap-3 overflow-x-auto scrollbar-none">
            {[
              ["inicio", "Inicio", HomeIcon],
              ["diario", "Diario", BookOpen],
              ["partidos", "Partidos", Trophy],
              ["amigos", "Amigos", Users],
              ["perfil", "Perfil", UserCircle2],
            ].map(([key, label, Icon]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  tab === key
                    ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </nav>

          {/* Vistas principales */}
          <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
            {tab === "inicio" && (
              <Feed
                me={me}
                users={users}
                matches={matches}
                reviews={reviews}
                friendships={friendships}
                onOpenMatch={setSelectedMatchId}
                onToggleLike={toggleLike}
              />
            )}
            {tab === "diario" && (
              <Diary
                me={me}
                matches={matches}
                reviews={reviews}
                onOpenMatch={setSelectedMatchId}
                onDelete={handleDeleteReview}
              />
            )}
            {tab === "partidos" && (
              <Matches
                matches={matches}
                query={matchQuery}
                setQuery={setMatchQuery}
                showAdd={showAddMatch}
                setShowAdd={setShowAddMatch}
                onOpenMatch={setSelectedMatchId}
                onAddMatch={(m) => {
                  handleAddMatch(m);
                  setShowAddMatch(false);
                  setSelectedMatchId(m.id);
                }}
              />
            )}
            {tab === "amigos" && (
              <Friends
                me={me}
                users={users}
                friendships={friendships}
                onToggleFollow={toggleFollow}
              />
            )}
            {tab === "perfil" && (
              <Profile
                me={me}
                matches={matches}
                reviews={reviews}
                onOpenMatch={setSelectedMatchId}
                onLogout={() => setActive(null)}
              />
            )}
          </main>

          {/* Modal de Detalle */}
          {selectedMatchId && (
            <MatchDetailModal
              matchId={selectedMatchId}
              matches={matches}
              users={users}
              reviews={reviews}
              me={me}
              onClose={() => setSelectedMatchId(null)}
              onToggleLike={toggleLike}
              onSaveReview={handleSaveReview}
              onDeleteReview={handleDeleteReview}
            />
          )}
        </>
      )}
    </div>
  );
}

function AuthScreen({ users, onLogin, onRegister }) {
  const [mode, setMode] = useState("login");

  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [regName, setRegName] = useState("");
  const [regFavoriteTeam, setRegFavoriteTeam] = useState("");
  const [regEmoji, setRegEmoji] = useState(AVATARS[0]);
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regError, setRegError] = useState("");

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setLoginError("");

    const targetUser = users.find(
      (u) => u.name.trim().toLowerCase() === loginUsername.trim().toLowerCase()
    );

    if (!targetUser) {
      setLoginError("Usuario no encontrado.");
      return;
    }

    if (targetUser.password && targetUser.password !== loginPassword) {
      setLoginError("Contraseña incorrecta.");
      return;
    }

    onLogin(targetUser);
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setRegError("");

    if (!regName.trim()) {
      setRegError("Ingresá un nombre de usuario.");
      return;
    }

    const exists = users.some(
      (u) => u.name.trim().toLowerCase() === regName.trim().toLowerCase()
    );
    if (exists) {
      setRegError("Ese nombre de usuario ya existe.");
      return;
    }

    if (!regPassword) {
      setRegError("Ingresá una contraseña.");
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError("Las contraseñas no coinciden.");
      return;
    }

    const newUser = {
      id: uid("u"),
      name: regName.trim(),
      password: regPassword,
      emoji: regEmoji,
      favoriteTeam: regFavoriteTeam.trim()
    };

    onRegister(newUser);
  };

  const fillDemoLogin = (username) => {
    setLoginUsername(username);
    setLoginPassword("123");
    setLoginError("");
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-slate-950">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl max-w-md w-full">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">⚽</div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
            Fubolxd
          </h1>
          <p className="text-xs text-slate-400 mt-2">
            El Letterboxd del fútbol. Registrá tus partidos y compartí con tus amigos.
          </p>
          <div className="inline-flex items-center gap-1.5 mt-3 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full font-semibold">
            <Cloud size={12} /> Sincronización en la nube activa
          </div>
        </div>

        <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => { setMode("login"); setLoginError(""); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
              mode === "login"
                ? "bg-emerald-500 text-slate-950 shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => { setMode("register"); setRegError(""); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
              mode === "register"
                ? "bg-emerald-500 text-slate-950 shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Crear Cuenta
          </button>
        </div>

        {mode === "login" && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Usuario
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="Ej. Fede"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {loginError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-3 py-2 rounded-xl text-center font-medium">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              Ingresar a mi cuenta
            </button>

            <div className="pt-4 border-t border-slate-800">
              <p className="text-[11px] text-slate-400 font-semibold mb-2 text-center">
                💡 Cuentas de prueba disponibles (clave: <code className="text-emerald-400 font-mono">123</code>):
              </p>
              <div className="flex justify-center gap-2">
                {["Fede", "Cami", "Naza"].map((demoName) => (
                  <button
                    key={demoName}
                    type="button"
                    onClick={() => fillDemoLogin(demoName)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-[11px] font-semibold text-slate-300 transition cursor-pointer"
                  >
                    {demoName}
                  </button>
                ))}
              </div>
            </div>
          </form>
        )}

        {mode === "register" && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Nombre de usuario
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Ej. Mateo"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Equipo favorito (opcional)
              </label>
              <input
                type="text"
                value={regFavoriteTeam}
                onChange={(e) => setRegFavoriteTeam(e.target.value)}
                placeholder="Ej. Barcelona, Argentina..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Elegí tu avatar
              </label>
              <div className="flex flex-wrap gap-1.5">
                {AVATARS.map((a, idx) => (
                  <button
                    key={`${a}-${idx}`}
                    type="button"
                    onClick={() => setRegEmoji(a)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border transition cursor-pointer ${
                      a === regEmoji ? "bg-emerald-500/20 border-emerald-500 scale-110" : "bg-slate-800 border-slate-700 hover:border-slate-500"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Contraseña
                </label>
                <div className="relative">
                  <Key size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-2.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Confirmar
                </label>
                <div className="relative">
                  <Key size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-2.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {regError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-3 py-2 rounded-xl text-center font-medium">
                {regError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg shadow-emerald-500/20 cursor-pointer mt-2"
            >
              Crear mi cuenta
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Feed({ me, users, matches, reviews, friendships, onOpenMatch, onToggleLike }) {
  const followingIds = new Set(friendships.filter((f) => f.followerId === me.id).map((f) => f.followingId));
  followingIds.add(me.id);
  const feedReviews = reviews.filter((r) => followingIds.has(r.userId)).sort((a, b) => b.createdAt - a.createdAt);

  if (feedReviews.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 my-4">
        <Trophy size={40} className="mx-auto mb-3 text-slate-600" />
        <h3 className="font-bold text-slate-200 mb-1">Tu feed está vacío</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Seguí a otros usuarios en la pestaña "Amigos" o agregá tu primera reseña buscando un partido en "Partidos".
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-semibold">
        <span>Actividad reciente en vivo</span>
        <span>{feedReviews.length} publicaciones</span>
      </div>

      {feedReviews.map((r) => {
        const u = users.find((x) => x.id === r.userId);
        const m = matches.find((x) => x.id === r.matchId);
        if (!u || !m) return null;
        const liked = (r.likes || []).includes(me.id);

        return (
          <div key={r.id} className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Avatar user={u} size={36} />
                <div>
                  <div className="font-bold text-xs text-slate-100 flex items-center gap-1.5">
                    {u.name}
                    {u.favoriteTeam && (
                      <span className="text-[10px] font-normal text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                        {u.favoriteTeam}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500">{fmtDate(r.watchedDate)}</div>
                </div>
              </div>
              <StarRating rating={r.rating} size={15} />
            </div>

            <div
              onClick={() => onOpenMatch(m.id)}
              className="w-full text-left bg-slate-950/80 hover:bg-slate-950 border border-slate-800 rounded-xl p-3 transition group cursor-pointer"
            >
              <MatchScoreBadge match={m} />
              <div className="text-center text-[10px] text-slate-400 mt-2 font-medium">
                {m.competition} {m.venue && `• ${m.venue}`}
              </div>
            </div>

            {r.text && (
              <p className="text-xs text-slate-300 italic bg-slate-950/40 border-l-2 border-emerald-500/60 pl-3 py-1">
                "{r.text}"
              </p>
            )}

            {(r.mvp || r.locationType) && (
              <div className="flex flex-wrap gap-2 text-[10px]">
                {r.mvp && (
                  <span className="bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                    <Award size={11} /> MVP: {r.mvp}
                  </span>
                )}
                {r.locationType && (
                  <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                    📍 {r.locationType}
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-1 text-xs text-slate-400 border-t border-slate-800/60">
              <button
                onClick={() => onOpenMatch(m.id)}
                className="flex items-center gap-1 hover:text-emerald-400 transition cursor-pointer"
              >
                <MessageCircle size={14} />
                <span>Ver partido y comentarios</span>
              </button>

              <button
                onClick={() => onToggleLike(r.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition cursor-pointer ${
                  liked ? "text-rose-400 bg-rose-500/10 font-bold" : "hover:text-rose-400"
                }`}
              >
                <Heart size={14} fill={liked ? "currentColor" : "none"} />
                <span>{(r.likes || []).length}</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Diary({ me, matches, reviews, onOpenMatch, onDelete }) {
  const mine = reviews
    .filter((r) => r.userId === me.id)
    .sort((a, b) => (b.watchedDate || "").localeCompare(a.watchedDate || ""));

  if (mine.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 my-4">
        <BookOpen size={40} className="mx-auto mb-3 text-slate-600" />
        <h3 className="font-bold text-slate-200 mb-1">Tu diario está vacío</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          No has registrado ningún partido aún. Buscá tu partido favorito en la sección "Partidos" y agregá tu primera opinión.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-semibold">
        <span>Historial de partidos vistos</span>
        <span>{mine.length} registros</span>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800/60">
        {mine.map((r) => {
          const m = matches.find((x) => x.id === r.matchId);
          if (!m) return null;
          return (
            <div key={r.id} className="p-3.5 hover:bg-slate-800/40 transition flex items-center justify-between gap-3">
              <div onClick={() => onOpenMatch(m.id)} className="text-left flex-1 min-w-0 cursor-pointer">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-sm text-slate-100 truncate">
                    {m.teamA} <span className="text-emerald-400">{scoreLabel(m)}</span> {m.teamB}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-2">
                  <span>📅 {fmtDate(r.watchedDate)}</span>
                  <span>•</span>
                  <span className="truncate">{m.competition}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <StarRating rating={r.rating} size={13} />
                <button
                  onClick={() => onDelete(r.id)}
                  className="text-slate-500 hover:text-rose-400 transition p-1 cursor-pointer"
                  title="Eliminar reseña"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Matches({ matches, query, setQuery, showAdd, setShowAdd, onOpenMatch, onAddMatch }) {
  const filtered = matches.filter((m) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (m.teamA + " " + m.teamB + " " + m.competition).toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por equipo o torneo..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {!showAdd ? (
          <button
            onClick={() => setShowAdd(true)}
            className="border-2 border-dashed border-slate-800 hover:border-emerald-500/50 bg-slate-900/50 hover:bg-slate-900 rounded-2xl p-4 flex flex-col items-center justify-center text-center transition min-h-[100px] group cursor-pointer"
          >
            <Plus size={24} className="text-slate-500 group-hover:text-emerald-400 transition mb-1" />
            <span className="text-xs font-bold text-slate-400 group-hover:text-emerald-400 transition">
              Cargar nuevo partido
            </span>
          </button>
        ) : (
          <AddMatchForm onAdd={onAddMatch} onCancel={() => setShowAdd(false)} />
        )}

        {filtered.map((m) => (
          <div
            key={m.id}
            onClick={() => onOpenMatch(m.id)}
            className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-4 text-left transition group shadow-md flex flex-col justify-between cursor-pointer"
          >
            <MatchScoreBadge match={m} />
            <div className="text-center text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-800/60 font-medium">
              {m.competition} • {fmtDate(m.date)}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center text-slate-500 py-8 text-xs">
          No se encontraron partidos para "{query}". Podés agregarlo vos mismo arriba.
        </div>
      )}
    </div>
  );
}

function AddMatchForm({ onAdd, onCancel }) {
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [golesA, setGolesA] = useState("");
  const [golesB, setGolesB] = useState("");
  const [penales, setPenales] = useState("");
  const [competition, setCompetition] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:col-span-2 space-y-3 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <span className="text-xs font-bold text-slate-200">Registrar Nuevo Partido</span>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-200 cursor-pointer">
          <X size={16} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <input
          placeholder="Equipo Local"
          value={teamA}
          onChange={(e) => setTeamA(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
        />
        <input
          placeholder="Equipo Visitante"
          value={teamB}
          onChange={(e) => setTeamB(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
        />
        <input
          type="number"
          placeholder="Goles Local"
          value={golesA}
          onChange={(e) => setGolesA(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
        />
        <input
          type="number"
          placeholder="Goles Visitante"
          value={golesB}
          onChange={(e) => setGolesB(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
        />
      </div>

      <input
        placeholder="Penales (opcional, ej: 4-2)"
        value={penales}
        onChange={(e) => setPenales(e.target.value)}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
      />

      <input
        placeholder="Competición (ej: Champions League 2024)"
        value={competition}
        onChange={(e) => setCompetition(e.target.value)}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
      />

      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
      />

      <button
        disabled={!teamA.trim() || !teamB.trim()}
        onClick={() => {
          onAdd({
            id: uid("m"),
            teamA: teamA.trim(),
            teamB: teamB.trim(),
            golesA: Number(golesA) || 0,
            golesB: Number(golesB) || 0,
            penales: penales.trim(),
            competition: competition.trim() || "Amistoso",
            date: date || new Date().toISOString().slice(0, 10),
          });
        }}
        className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition disabled:opacity-40 cursor-pointer"
      >
        Guardar Partido en la Nube
      </button>
    </div>
  );
}

function Friends({ me, users, friendships, onToggleFollow }) {
  const followingIds = new Set(friendships.filter((f) => f.followerId === me.id).map((f) => f.followingId));
  const others = users.filter((u) => u.id !== me.id);

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Comunidad Fubolxd
        </h3>
        <div className="space-y-2">
          {others.map((u) => {
            const isFollowing = followingIds.has(u.id);
            return (
              <div
                key={u.id}
                className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <Avatar user={u} size={36} />
                  <div>
                    <div className="font-bold text-xs text-slate-100">{u.name}</div>
                    {u.favoriteTeam && (
                      <div className="text-[10px] text-slate-400">Fan de {u.favoriteTeam}</div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onToggleFollow(u.id, isFollowing)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                    isFollowing
                      ? "bg-slate-800 text-slate-300 hover:bg-rose-500/20 hover:text-rose-300"
                      : "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                  }`}
                >
                  {isFollowing ? "Siguiendo" : "Seguir"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Profile({ me, matches, reviews, onOpenMatch, onLogout }) {
  const mine = reviews.filter((r) => r.userId === me.id);
  const avg = mine.length ? (mine.reduce((s, r) => s + r.rating, 0) / mine.length).toFixed(1) : "—";
  const topReviews = [...mine].sort((a, b) => b.rating - a.rating).slice(0, 3);

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-3">
        <div className="flex justify-center">
          <Avatar user={me} size={72} />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-100">{me.name}</h2>
          {me.favoriteTeam && (
            <p className="text-xs text-emerald-400 font-semibold mt-0.5">
              Hinchada de {me.favoriteTeam}
            </p>
          )}
        </div>

        <button
          onClick={onLogout}
          className="text-xs text-rose-400 hover:text-rose-300 font-semibold inline-flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-full transition cursor-pointer"
        >
          <LogOut size={13} /> Cerrar Sesión
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
          <div className="text-2xl font-black text-emerald-400">{mine.length}</div>
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Partidos Vistos</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
          <div className="text-2xl font-black text-amber-400">{avg}</div>
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Promedio Estrellas</div>
        </div>
      </div>

      {topReviews.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Tus Mejores Partidos
          </h3>
          <div className="space-y-2">
            {topReviews.map((r) => {
              const m = matches.find((x) => x.id === r.matchId);
              if (!m) return null;
              return (
                <div
                  key={r.id}
                  onClick={() => onOpenMatch(m.id)}
                  className="w-full flex items-center justify-between p-2.5 bg-slate-950/60 hover:bg-slate-950 rounded-xl border border-slate-800 text-left transition cursor-pointer"
                >
                  <span className="text-xs font-bold text-slate-200 truncate">
                    {m.teamA} vs {m.teamB}
                  </span>
                  <StarRating rating={r.rating} size={12} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function MatchDetailModal({ matchId, matches, users, reviews, me, onClose, onSaveReview, onDeleteReview, onToggleLike }) {
  const m = matches.find((x) => x.id === matchId);
  const matchReviews = reviews.filter((r) => r.matchId === matchId);
  const myReview = matchReviews.find((r) => r.userId === me.id);

  const [rating, setRating] = useState(myReview ? myReview.rating : 5);
  const [text, setText] = useState(myReview ? myReview.text || "" : "");
  const [mvp, setMvp] = useState(myReview ? myReview.mvp || "" : "");
  const [locationType, setLocationType] = useState(myReview ? myReview.locationType || "En casa" : "En casa");

  if (!m) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <span className="text-xs font-bold text-slate-400 uppercase">Detalle del Partido</span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
          <MatchScoreBadge match={m} size="text-lg" />
          <p className="text-xs text-slate-400 mt-2">{m.competition} • {fmtDate(m.date)}</p>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-3">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            {myReview ? "Editar tu reseña" : "Escribir tu reseña"}
          </h4>

          <div>
            <label className="block text-[10px] text-slate-400 mb-1">Calificación</label>
            <StarRating rating={rating} size={22} onRate={setRating} />
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 mb-1">Tu reseña / comentario</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="¿Qué te pareció el partido?..."
              rows={3}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Jugador del Partido (MVP)</label>
              <input
                value={mvp}
                onChange={(e) => setMvp(e.target.value)}
                placeholder="Ej. Lionel Messi"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1">¿Dónde lo viste?</label>
              <select
                value={locationType}
                onChange={(e) => setLocationType(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="En casa">En casa</option>
                <option value="En la cancha">En la cancha</option>
                <option value="En bar / fan zone">En bar / fan zone</option>
                <option value="Con amigos">Con amigos</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => {
                onSaveReview({
                  id: myReview ? myReview.id : uid("r"),
                  userId: me.id,
                  matchId: m.id,
                  rating,
                  text: text.trim(),
                  mvp: mvp.trim(),
                  locationType,
                  watchedDate: new Date().toISOString().slice(0, 10),
                  createdAt: myReview ? myReview.createdAt : Date.now(),
                  likes: myReview ? myReview.likes || [] : [],
                });
                onClose();
              }}
              className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition cursor-pointer"
            >
              Guardar Reseña en la Nube
            </button>
            {myReview && (
              <button
                onClick={() => {
                  onDeleteReview(myReview.id);
                  onClose();
                }}
                className="px-3 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold rounded-lg text-xs transition cursor-pointer"
              >
                Eliminar
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Reseñas de la Comunidad ({matchReviews.length})
          </h4>

          {matchReviews.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No hay reseñas para este partido aún.</p>
          ) : (
            matchReviews.map((r) => {
              const u = users.find((x) => x.id === r.userId);
              if (!u) return null;
              const liked = (r.likes || []).includes(me.id);

              return (
                <div key={r.id} className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar user={u} size={28} />
                      <span className="font-bold text-xs text-slate-200">{u.name}</span>
                    </div>
                    <StarRating rating={r.rating} size={13} />
                  </div>

                  {r.text && <p className="text-xs text-slate-300 italic">{r.text}</p>}

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span>{fmtDate(r.watchedDate)}</span>
                    <button
                      onClick={() => onToggleLike(r.id)}
                      className={`flex items-center gap-1 cursor-pointer ${liked ? "text-rose-400" : "hover:text-rose-400"}`}
                    >
                      <Heart size={12} fill={liked ? "currentColor" : "none"} />
                      <span>{(r.likes || []).length}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
