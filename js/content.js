/*
 * ============================================================
 *  PRESENTATION CONTENT  —  edit this file to change the words
 * ============================================================
 *
 *  Each FOLDER is one file in the 3-D carousel.
 *  Each folder has PAGES that flip when you open it.
 *
 *  Page types you can use:
 *
 *   { type: "title",   title: "...", subtitle: "...", note: "..." }
 *   { type: "text",    title: "...", text: "...", bullets: ["...", "..."], icon: "check" | "cross" | "dot" | "number" }
 *   { type: "quotes",  title: "...", quotes: ["...", "..."], good: true | false }
 *   { type: "compare", title: "...", left: "Leader", right: "Manipulator", rows: [["Label", "left side", "right side"], ...] }
 *   { type: "quiz",    title: "...", scenario: "...", answer: "Leader" | "Manipulator", why: "..." }
 *   { type: "big",     text: "...", small: "..." }          (one big sentence)
 *
 *  Media pages (put the file in the "media" folder first):
 *
 *   { type: "video",   title: "...", src: "media/my-video.mp4", poster: "media/my-picture.jpg", caption: "..." }
 *   { type: "pdf",     title: "...", src: "media/my-slides.pdf", caption: "..." }
 *   { type: "image",   title: "...", src: "media/my-picture.jpg", caption: "..." }
 *   { type: "gallery", title: "...", images: ["media/slide1.png", "media/slide2.png"], caption: "..." }
 *
 *  Remember: every line ends with a comma, and text goes "inside quotes".
 */

window.PRESENTATION = {
  title: "Who Holds the Strings?",
  subtitle: "Leaders and Manipulators",
  presenter: "Presented by Adriana Castano",  // shown on the first page

  folders: [
    {
      tab: "Start",
      color: "#e2b45a",
      title: "Who Holds the Strings?",
      subtitle: "Leaders and manipulators",
      pages: [
        { type: "title", title: "Who Holds the Strings?", subtitle: "How to tell a real leader from a manipulator" },
        {
          type: "text",
          title: "Think of a puppet",
          text: "Someone above the puppet pulls the strings. The puppet moves, but it doesn't choose where it goes.",
          bullets: [
            "Have you ever done something because someone pushed you — not because you wanted to?",
            "Today we will learn how to see the strings."
          ],
          icon: "dot"
        }
      ]
    },

    {
      tab: "The Video",
      color: "#c98b3a",
      title: "The Video",
      subtitle: "Watch carefully",
      pages: [
        {
          type: "video",
          title: "Who Holds the Strings?",
          src: "media/who-holds-the-strings.mp4",
          poster: "media/who-holds-the-strings-poster.jpg",
          caption: "Watch carefully. Who is really in control?"
        },
        {
          type: "text",
          title: "Let's talk about it",
          bullets: [
            "Who was pulling the strings?",
            "Did the others notice?",
            "How do you think they felt?",
            "What would a real leader do?"
          ],
          icon: "number"
        }
      ]
    },

    {
      tab: "Leaders",
      color: "#5fb37a",
      title: "What Is a Leader?",
      subtitle: "Someone who helps everyone",
      pages: [
        {
          type: "text",
          title: "What is a leader?",
          text: "A leader helps a group reach a goal that is good for everyone.",
          bullets: [
            "Listens to everyone",
            "Is honest, even when it's hard",
            "Shares the credit",
            "Includes people who are left out",
            "Lets you say no"
          ],
          icon: "check"
        },
        {
          type: "quotes",
          title: "A leader says...",
          good: true,
          quotes: [
            "What do you think?",
            "Let's do it together.",
            "Great idea — thank you!",
            "It's okay if you don't want to."
          ]
        },
        {
          type: "big",
          text: "A good leader is happy when other people shine.",
          small: "They don't need to be the loudest or the most popular."
        }
      ]
    },

    {
      tab: "Manipulators",
      color: "#d0574e",
      title: "What Is a Manipulator?",
      subtitle: "Someone who pulls the strings",
      pages: [
        {
          type: "text",
          title: "What is a manipulator?",
          text: "A manipulator tries to control people to get what they want. They can look like a leader, but they only care about themselves.",
          bullets: [
            "Uses secrets and tricks",
            "Makes you feel guilty or scared",
            "Takes the credit",
            "Leaves people out on purpose",
            "Gets angry when you say no"
          ],
          icon: "cross"
        },
        {
          type: "quotes",
          title: "A manipulator says...",
          good: false,
          quotes: [
            "If you don't do this, you're not my friend.",
            "Don't tell anyone.",
            "Everyone agrees with me.",
            "Don't play with them."
          ]
        },
        {
          type: "text",
          title: "Why is it hard to see?",
          text: "Manipulators can be friendly, funny and popular. At first it can feel nice to be in their group.",
          bullets: [
            "The strings are hard to see...",
            "...but they are there."
          ],
          icon: "dot"
        }
      ]
    },

    {
      tab: "Compare",
      color: "#6f9fd8",
      title: "Leader or Manipulator?",
      subtitle: "Side by side",
      pages: [
        {
          type: "compare",
          title: "Side by side",
          left: "Leader",
          right: "Manipulator",
          rows: [
            ["Goal", "Good for everyone", "Good only for me"],
            ["Honesty", "Open and honest", "Secrets and tricks"],
            ["When you say no", "Respects it", "Gets angry"],
            ["Credit", "Shares it", "Takes it"],
            ["Other people", "Brings them in", "Pushes them out"],
            ["You feel...", "Safe and free", "Worried and stuck"]
          ]
        },
        {
          type: "big",
          text: "Ask yourself: Who does this help?",
          small: "If the answer is \"only them\", you may have found a string."
        }
      ]
    },

    {
      tab: "Warning Signs",
      color: "#e08a4c",
      title: "Spot the Strings",
      subtitle: "Warning signs",
      pages: [
        {
          type: "text",
          title: "Spot the strings",
          bullets: [
            "Guilt: \"After everything I did for you...\"",
            "Too much praise, just to get something",
            "Threats: \"I'll tell everyone...\"",
            "Secret groups that leave people out",
            "Changing the rules so they always win",
            "Making you choose between friends"
          ],
          icon: "cross"
        },
        {
          type: "big",
          text: "Your feelings are a clue.",
          small: "If you often feel nervous, confused or scared to say no around someone, a string might be pulling you."
        }
      ]
    },

    {
      tab: "Quiz",
      color: "#4fb6b0",
      title: "Quiz Time!",
      subtitle: "Leader or manipulator?",
      pages: [
        { type: "quiz", title: "Leader or manipulator?", scenario: "\"Let's vote on the game, so everyone gets a say.\"", answer: "Leader", why: "Everyone gets to choose." },
        { type: "quiz", title: "Leader or manipulator?", scenario: "\"If you play with them, you can't be in our group.\"", answer: "Manipulator", why: "This is a threat. It leaves people out." },
        { type: "quiz", title: "Leader or manipulator?", scenario: "The team finishes a project. One person tells the teacher: \"I did it all by myself.\"", answer: "Manipulator", why: "They take the credit for everyone's work." },
        { type: "quiz", title: "Leader or manipulator?", scenario: "Someone sees a new student alone and says: \"Come and sit with us!\"", answer: "Leader", why: "They bring people in." },
        { type: "quiz", title: "Leader or manipulator?", scenario: "\"Don't tell the teacher. It's our secret. You'll be in trouble too.\"", answer: "Manipulator", why: "They use secrets and fear." },
        { type: "quiz", title: "Leader or manipulator?", scenario: "\"I don't agree with you, but it's your choice. That's okay.\"", answer: "Leader", why: "They respect your choice." }
      ]
    },

    {
      tab: "Cut the Strings",
      color: "#b99be0",
      title: "Cut the Strings",
      subtitle: "What can we do?",
      pages: [
        {
          type: "text",
          title: "What can we do?",
          bullets: [
            "Ask: \"Who does this help?\"",
            "Say no — kindly and clearly",
            "Stay with friends who make you feel safe",
            "Talk to a trusted adult",
            "Don't follow the crowd if the crowd is wrong",
            "Be kind to people who are left out"
          ],
          icon: "check"
        },
        {
          type: "big",
          text: "Praise the real leaders.",
          small: "When someone leads in a good way, notice it and say thank you. Good leaders make the whole class stronger."
        }
      ]
    },

    {
      tab: "The End",
      color: "#e2b45a",
      title: "Remember",
      subtitle: "Thank you!",
      pages: [
        {
          type: "text",
          title: "Remember",
          bullets: [
            "Leaders lift everyone up.",
            "Manipulators pull strings for themselves.",
            "You can choose who you follow."
          ],
          icon: "check"
        },
        { type: "title", title: "Thank you!", subtitle: "Be the one who leads with kindness.", note: "Any questions?" }
      ]
    }
  ]
};
