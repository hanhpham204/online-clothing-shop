import Link from "next/link";

type Product = {
  name: string;
  category: string;
  price: string;
  imageUrl: string;
  imageAlt: string;
};

const navLeft = ["Collections", "Heritage"];
const navRight = ["Bespoke", "Search"];

const values = [
  {
    icon: "workspace_premium",
    title: "Exclusivity",
    description: "Limited editions crafted for those who appreciate the rarity of true artistry.",
  },
  {
    icon: "auto_awesome",
    title: "Craftsmanship",
    description: "Honoring century-old techniques combined with modern material science.",
  },
  {
    icon: "eco",
    title: "Sustainability",
    description: "A commitment to ethical sourcing and enduring quality that lasts lifetimes.",
  },
];

const products: Product[] = [
  {
    name: "Obscura Vessel",
    category: "Ceramic Sculpture",
    price: "$1,250",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC8V_FBqadLz-0F4feJQFaO3OsokYBZqF-J1Vt5Zp5RgsXHDgHQoU1jdWsxvuW9UVyqqh0nfN7j3j8sqlG6iFMGbOKVHiKNqIASC3CMLeVM9AJwDXmspkymrcOq9rbICXmYzVuQo1WZybz0mo9pFWxmiugzlYJVbzw2ikG3bQfi8BlJoiNxwXhFqWlz-CuT5i-UYzA9UALth_b_l0Td3iUSYCKjLMA0gD0lY5-QFljIeu5K9PKYvSZTvreHnPpNvn96ZPRkyHoFi_fv",
    imageAlt: "A minimalist white designer object on a grey textured background.",
  },
  {
    name: "Lumiere Prism",
    category: "Glass Art",
    price: "$2,800",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBA5-pjkQ5ZPQGIpDY469KucLWvmLrfURI1buOoU_xfG_XFMxkIgdcRy0hoYrDgAVZLuEBKqDLFs7TT5Fi2BxQV6esKyo3j8VjoJKO-Lkt5iRwT5EXZaqGJqDHvkX4KMld403csYpFMH2CH98tV5ZMtg_EjbfdPgKLaflTXkCdIuAK06xwTCO7n6F5pDI_04q8WfOZnB0DsCLO-cnUCLdW1U7YEVTzsTuQmZRYB03Ia4s0SDr1v24nVgyePfMJj1YKmCDLruWv7-3Se",
    imageAlt: "An abstract glass sculpture on a dark marble pedestal.",
  },
  {
    name: "Sonic Aethel",
    category: "Audio Engineering",
    price: "$950",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC1qPeqW_3xXpwl8F7dD5Fw_qFpir9w79FQzWUi-wW5k-KOHX2cn1k23bOqowrAGteYV3BbT5m00wdOCkdSvyRJ_0SUYkNRZrw3estYS1q7LiaKvq2-VWOzAZyqe7rFEn9cmvZ-B7Cl4ue_8ONnXG2ExRpZJgxABCgBTUq9Av6pHUZzdB9v3SWgqg3qp0yheluSG4g5nq-UFHeaDHrFrN52Dh_94McrkAOtNBX01ih6zw1gyuCwgKEsjNPskuu3iDo2u3c4yXyyJorl",
    imageAlt: "Premium studio headphones with copper accents in low light.",
  },
];

export default function HomePage() {
  return (
    <main
      className="overflow-x-hidden bg-[#131313] text-[#e5e2e1]"
      style={{ fontFamily: "'Manrope', sans-serif" }}
    >
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,400;0,700;1,400&family=Manrope:wght@300;400;600&display=swap"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
      />

      <style>{`
        .material-symbols-outlined {
          font-variation-settings: "FILL" 0, "wght" 300, "GRAD" 0, "opsz" 24;
        }
      `}</style>

      <nav className="fixed top-0 z-50 w-full bg-[#131313]/60 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] backdrop-blur-2xl after:absolute after:bottom-0 after:left-0 after:h-[0.5px] after:w-full after:bg-linear-to-r after:from-transparent after:via-[#46474a]/20 after:to-transparent after:content-['']">
        <div className="mx-auto flex h-24 max-w-full items-center justify-between px-8">
          <div className="flex items-center gap-6">
            <span className="material-symbols-outlined cursor-pointer text-[#d9c49e] transition-transform duration-500 active:scale-95">
              menu
            </span>
            <div className="hidden items-center gap-8 md:flex">
              {navLeft.map((item, index) => (
                <a
                  key={item}
                  href="#"
                  className={`font-['Manrope'] text-[0.6875rem] uppercase tracking-widest transition-colors duration-500 ${
                    index === 0
                      ? "border-b border-[#d9c49e] pb-1 text-[#d9c49e]"
                      : "text-[#c8c6c8] hover:text-[#d9c49e]"
                  }`}
                >
                  {item}
                </a>
              ))}
            </div>
          </div>

          <div className="cursor-pointer text-2xl tracking-[0.2em] text-[#d9c49e]" style={{ fontFamily: "'Noto Serif', serif" }}>
            Luja Laf
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden items-center gap-8 md:flex">
              {navRight.map((item) => (
                <a
                  key={item}
                  href="#"
                  className="font-['Manrope'] text-[0.6875rem] uppercase tracking-widest text-[#c8c6c8] transition-colors duration-500 hover:text-[#d9c49e]"
                >
                  {item}
                </a>
              ))}
            </div>
            <span className="material-symbols-outlined cursor-pointer text-[#d9c49e] transition-transform duration-500 active:scale-95">
              shopping_bag
            </span>
          </div>
        </div>
      </nav>

      <section
        className="relative flex min-h-screen items-center justify-center overflow-hidden pt-24"
        style={{ background: "radial-gradient(circle at 50% 50%, #231902 0%, #131313 70%)" }}
      >
        <div className="absolute top-1/4 -right-20 h-96 w-96 rounded-full bg-[#231902]/30 blur-[120px]" />
        <div className="absolute bottom-1/4 -left-20 h-80 w-80 rounded-full bg-[#231902]/20 blur-[100px]" />
        <div className="container relative z-10 mx-auto flex flex-col items-center px-8">
          <div className="mb-16 text-center">
            <span className="mb-6 block text-[0.6875rem] uppercase tracking-[0.4em] text-[#c8c6c8]">
              Est. 1924 - Paris
            </span>
            <h1
              className="mx-auto mb-10 max-w-4xl text-6xl leading-[1.1] text-[#e5e2e1] italic md:text-[5.5rem]"
              style={{ fontFamily: "'Noto Serif', serif" }}
            >
              The Art of Living
            </h1>
            <p className="mx-auto mb-12 max-w-xl text-lg leading-relaxed font-light text-[#c8c6c8]">
              Curating a lifestyle of quiet confidence. Every piece in our collection is a testament to the beauty of
              intentional design.
            </p>
            <button className="rounded-full bg-[#d9c49e] px-12 py-5 text-[0.6875rem] uppercase tracking-widest text-[#3b2f14] outline-[0.5px] outline-[#46474a]/20 transition-all duration-500 hover:brightness-110">
              Explore the Archive
            </button>
          </div>
          <div className="group relative aspect-video w-full max-w-5xl overflow-hidden rounded-xl shadow-2xl">
            <div className="pointer-events-none absolute inset-0 z-10 bg-linear-to-t from-[#131313]/20 via-transparent to-transparent" />
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCJLT-GVhP71_SpT_sIwalZ7ryIbC0PMkmj_xcMgNCxw7htSfRQOVX-GjtDKJX6V9upih8Pwhy6ykt9ycl3vaE8cLVSwHLN3ySJRMPDAp8otc4ekfThew9czHafUYFJ-f6cipX3kvbRy23AtWXOvFB6yQByDqNrhvBXhaApVYgBPiS5QX7V-kmCft01kchBkQAeNAl0H4zZepHSi4NdQw9gE3d9GROSCi8-TsAvwH6mvQzhlhSuOibNMCh19myP-X86EizCefjuPCfk"
              alt="A minimalist designer watch on a dark reflective surface."
              className="h-full w-full object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-[1.02]"
            />
          </div>
        </div>
      </section>

      <section className="border-y border-[#46474a]/10 bg-[#1c1b1b] py-32">
        <div className="container mx-auto px-8">
          <div className="grid grid-cols-1 gap-20 md:grid-cols-3">
            {values.map((item) => (
              <div key={item.title} className="flex flex-col items-center text-center">
                <span className="material-symbols-outlined mb-6 text-4xl text-[#d9c49e]">{item.icon}</span>
                <h3 className="mb-4 text-xl text-[#e5e2e1]" style={{ fontFamily: "'Noto Serif', serif" }}>
                  {item.title}
                </h3>
                <p className="max-w-xs text-sm leading-relaxed text-[#c8c6c8]">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden bg-[#131313] py-40">
        <div className="container mx-auto mb-20 flex flex-col gap-8 px-8 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="mb-4 block text-[0.6875rem] uppercase tracking-[0.3em] text-[#d9c49e]">New Arrivals</span>
            <h2 className="text-4xl text-[#e5e2e1] md:text-5xl" style={{ fontFamily: "'Noto Serif', serif" }}>
              Artisanal Objects
            </h2>
          </div>
        </div>

        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-8 pb-20 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <div key={product.name} className="group">
              <div className="relative mb-8 aspect-4/5 overflow-hidden rounded-lg bg-[#1c1b1b]">
                <img
                  src={product.imageUrl}
                  alt={product.imageAlt}
                  className="h-full w-full object-cover transition-transform duration-1500 group-hover:scale-105"
                />
                <div className="absolute right-6 bottom-6 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <button className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d9c49e]/90 text-[#3b2f14] shadow-lg backdrop-blur">
                    <span className="material-symbols-outlined text-sm">add</span>
                  </button>
                </div>
              </div>
              <div className="flex items-start justify-between px-2">
                <div>
                  <h4 className="mb-1 text-lg text-[#e5e2e1]" style={{ fontFamily: "'Noto Serif', serif" }}>
                    {product.name}
                  </h4>
                  <p className="text-[0.6875rem] uppercase tracking-widest text-[#c8c6c8]">{product.category}</p>
                </div>
                <span className="text-lg text-[#d9c49e]" style={{ fontFamily: "'Noto Serif', serif" }}>
                  {product.price}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="relative mx-auto mt-10 h-px max-w-md bg-[#46474a]/20">
          <div className="absolute top-1/2 left-0 h-1 w-32 -translate-y-1/2 rounded-full bg-[#d9c49e] shadow-[0_0_15px_rgba(217,196,158,0.4)]" />
        </div>
      </section>

      <section className="relative flex items-center justify-center overflow-hidden py-60">
        <div className="absolute inset-0 z-0">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBlcjVPC7v6G1JToigJJmsXLTKuB_hS4Oj9N777Zx6aHPjw_g_AIEcrQN1ezxWJRuMH6-T7drUEf6GiOPvyz206kdWSJ3q2KdWbpPz9BVkaNbJefjMxY91vbaRG3AwMaZYiGQg4tIvrQoQVXKUsOIUnDmFehRGDWWIM7QusVTM6dGf6M1G5UN_7SBK9Urp4lnKj8d4wmUNoUk15Db6q-mxU-Nn5IwaevfCfhHeoZIAe9tuQQxbEzF4qnLV4qojH23WLl25T-YIf6ZWU"
            alt="Blurred interior of a luxury atelier."
            className="h-full w-full scale-110 object-cover opacity-30 blur-2xl"
          />
        </div>
        <div className="container relative z-10 mx-auto px-8">
          <div className="mx-auto max-w-4xl text-center">
            <span className="mb-12 block text-[0.6875rem] uppercase tracking-[0.5em] text-[#d9c49e]">The Legacy</span>
            <h2
              className="mb-16 text-5xl leading-tight text-[#e5e2e1] italic md:text-7xl"
              style={{ fontFamily: "'Noto Serif', serif" }}
            >
              A century of quiet luxury, crafted for the modern soul.
            </h2>
            <div className="grid grid-cols-1 gap-16 text-left md:grid-cols-2">
              <p className="text-lg leading-relaxed font-light text-[#c8c6c8]">
                Founded in the heart of the Marais, Luja Laf began as a small collection of bespoke leather goods.
                Today, it stands as a sanctuary for those who reject the ephemeral and embrace the eternal.
              </p>
              <p className="text-lg leading-relaxed font-light text-[#c8c6c8]">
                Our philosophy is simple: we create objects that gain beauty with age. We believe that true luxury is
                not loud; it is felt in the weight of a handle, the grain of wood, and the silence of a perfect room.
              </p>
            </div>
            <div className="mt-20 inline-block border-t border-[#46474a]/10 pt-10">
              <a
                href="#"
                className="border-b border-[#d9c49e]/30 pb-2 text-[0.6875rem] uppercase tracking-widest text-[#d9c49e] transition-all hover:border-[#d9c49e]"
              >
                Read our full heritage
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#0e0e0e] py-40">
        <div className="container mx-auto px-8">
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-16 rounded-3xl bg-[#2a2a2a]/40 p-12 outline-[0.5px] outline-[#46474a]/20 backdrop-blur-3xl md:flex-row md:p-24">
            <div className="flex-1">
              <span className="mb-6 block text-[0.6875rem] uppercase tracking-[0.3em] text-[#d9c49e]">Private Invitations</span>
              <h2 className="mb-6 text-4xl text-[#e5e2e1] md:text-5xl" style={{ fontFamily: "'Noto Serif', serif" }}>
                Join the Luja Laf
              </h2>
              <p className="mb-10 leading-relaxed text-[#c8c6c8]">
                Gain early access to seasonal collections, private viewings, and bespoke commissions. Membership is
                limited and by application only.
              </p>
              <form className="flex flex-col gap-8">
                <div className="relative">
                  <input
                    className="w-full border-b border-[#46474a]/30 bg-transparent py-4 text-[#e5e2e1] placeholder:text-[#46474a] focus:border-[#d9c49e] focus:outline-none"
                    placeholder="Email Address"
                    type="email"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <input
                    className="h-4 w-4 rounded-sm border-[#46474a] bg-[#201f1f] text-[#d9c49e] focus:ring-0"
                    id="terms"
                    type="checkbox"
                  />
                  <label className="text-[0.6875rem] uppercase tracking-wider text-[#c8c6c8]" htmlFor="terms">
                    I accept the privacy policy
                  </label>
                </div>
                <button className="self-start rounded-full bg-[#d9c49e] px-12 py-5 text-[0.6875rem] uppercase tracking-widest text-[#3b2f14] outline-[0.5px] outline-[#46474a]/20 transition-all hover:brightness-110 active:scale-95">
                  Request Membership
                </button>
              </form>
            </div>
            <div className="aspect-3/4 w-full overflow-hidden rounded-2xl shadow-2xl md:w-1/3">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBKtbpqSf5S3hJUZJUFNKbSoA71gpOufJMl1iSd3yahWU699AA7dSYEXiK9yoe4w-8ug2FyNxW_u7czdzrm6FF1RCN9zchCzKsfIjcZZzha3sH5iaJIASVzJdsmLT4VvyB9nQL6ERMkvSSBdewIxudP_1DsrZtrWh_Kc8fAzILUD_OnZo0GhvuYW49qDtXM775RjRJi5zz-NSLD_T74d4BKocryJ1VcHkBu1XxZzYI_Hk1Ij7zIwBrd2Z5q1eMysZCja4DUozpxR-To"
                alt="Premium invitation cards on a dark wooden desk."
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <footer className="w-full border-t border-[#1c1b1b] bg-[#0e0e0e] py-20">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-12 px-12">
          <div className="text-3xl tracking-widest text-[#d9c49e] italic" style={{ fontFamily: "'Noto Serif', serif" }}>
            ATELIER
          </div>
          <div className="flex flex-wrap justify-center gap-12">
            {["Collections", "Heritage", "Bespoke Service", "Privacy"].map((item) => (
              <a
                key={item}
                href="#"
                className="text-[0.6875rem] uppercase tracking-widest text-[#c8c6c8] opacity-60 transition-opacity duration-500 hover:text-[#d9c49e] hover:opacity-100"
              >
                {item}
              </a>
            ))}
          </div>
          <div className="flex gap-8">
            {["language", "camera", "mail"].map((icon) => (
              <span
                key={icon}
                className="material-symbols-outlined cursor-pointer text-[#c8c6c8] opacity-60 transition-all hover:text-[#d9c49e] hover:opacity-100"
              >
                {icon}
              </span>
            ))}
          </div>
          <div className="text-center text-[0.6875rem] uppercase tracking-widest text-[#c8c6c8] opacity-40">
            © 2024 THE DIGITAL ATELIER. ALL RIGHTS RESERVED.
          </div>
          <div className="flex gap-3 pt-3">
            <Link href="/register" className="rounded-full border border-[#46474a]/40 px-4 py-2 text-xs uppercase tracking-wider">
              Register
            </Link>
            <Link href="/login" className="rounded-full border border-[#46474a]/40 px-4 py-2 text-xs uppercase tracking-wider">
              Login
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
