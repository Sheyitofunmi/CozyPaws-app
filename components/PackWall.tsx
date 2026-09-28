import SmartImage from "@/components/SmartImage";

// Customer dogs (demo content: stock photos with made-up names).
const PACK = [
  { src: "/assets/pack/1.jpg", name: "Frankie", line: "4, beach dog, wears shades unironically" },
  { src: "/assets/pack/3.jpg", name: "Mochi", line: "3, destroyer of squeakers" },
  { src: "/assets/pack/2.jpg", name: "Otis", line: "6, professional napper" },
  { src: "/assets/pack/4.jpg", name: "Pom", line: "1, entirely made of fluff" },
  { src: "/assets/pack/5.jpg", name: "Biscotti", line: "2, zoomies on demand" },
  { src: "/assets/pack/6.jpg", name: "Blue", line: "5, fastest dog in the park (says Blue)" },
];

/** "the pack": a masonry wall of customer dogs. */
export default function PackWall() {
  return (
    <section className="pack" aria-labelledby="pack-title">
      <div className="pack__head">
        <h2 id="pack-title" className="story-title story-title--section">
          meet <em>the pack</em>
        </h2>
        <p>
          Dogs who shop with us, sent in by their humans. Tag <strong>#cozypawspack</strong> and yours could be
          next.
        </p>
      </div>
      <ul className="pack__wall">
        {PACK.map((dog) => (
          <li key={dog.src} className="pack-photo">
            <figure>
              <span className="pack-photo__img img-slot">
                <SmartImage src={dog.src} alt={`${dog.name}, one of the pack`} width={1000} height={1000} loading="lazy" sizes="(max-width: 900px) 45vw, 380px" />
              </span>
              <figcaption>
                <strong>{dog.name}</strong>, {dog.line}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}
