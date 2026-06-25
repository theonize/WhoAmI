// Book index — metadata plus the ordered list of chapters.
// To add a chapter: create a module in ./chapters, import it here, and add it
// to the `chapters` array. (Then add its path to the precache list in /sw.js.)
import ch1 from "./chapters/01-what-is-a-human.js";
import ch2 from "./chapters/02-apart-from-god.js";
import ch3 from "./chapters/03-child-of-god.js";

export const book = {
  title: "Who Am I?",
  subtitle: "A study of the human condition",
  tagline: "What is a human — apart from God, and as a child of God?",
  author: "",
  edition: "Skeleton edition",
  // Default Bible translation used throughout. WEB = World English Bible,
  // which is in the public domain, so it is safe to reproduce in full.
  translation: {
    code: "WEB",
    name: "World English Bible",
    note: "Scripture is quoted from the World English Bible (public domain). Tap any reference to read the full passage."
  },
  chapters: [ch1, ch2, ch3]
};

export default book;
