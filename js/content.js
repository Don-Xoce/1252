/*
 * ============================================================
 *  PRESENTATION CONTENT  —  edit this file to change the words
 * ============================================================
 *
 *  Every piece of text is written in three languages:
 *      { en: "English", es: "Español", ru: "Русский" }
 *  (Plain text "like this" also works; it then shows the same in every language.)
 *
 *  Each FOLDER is one folder in the 3-D carousel.
 *  Each folder has PAGES that turn when you open it.
 *
 *  Page types you can use:
 *
 *   { type: "title",   title: ..., subtitle: ..., note: ... }
 *   { type: "text",    title: ..., text: ..., bullets: [..., ...], icon: "check" | "cross" | "dot" | "number" }
 *   { type: "quotes",  title: ..., quotes: [..., ...], good: true | false }
 *   { type: "compare", title: ..., left: ..., right: ..., rows: [[label, left side, right side], ...] }
 *   { type: "quiz",    title: ..., scenario: ..., answer: "leader" | "manipulator", why: ... }
 *   { type: "big",     text: ..., small: ... }          (one big sentence)
 *
 *  Media pages (put the file in the "media" folder first):
 *
 *   { type: "video",   title: ..., src: "media/my-video.mp4", poster: "media/my-picture.jpg", caption: ... }
 *   { type: "pdf",     title: ..., src: "media/my-slides.pdf", caption: ... }
 *   { type: "image",   title: ..., src: "media/my-picture.jpg", caption: ... }
 *   { type: "gallery", title: ..., images: ["media/slide1.png", "media/slide2.png"], caption: ... }
 *
 *  Remember: every line ends with a comma, and text goes "inside quotes".
 */

window.PRESENTATION = {
  title: { en: "Who Holds the Strings?", es: "¿Quién mueve los hilos?", ru: "Кто дёргает за ниточки?" },
  presenter: { en: "Presented by Adriana Castano", es: "Presentado por Adriana Castano", ru: "Презентацию подготовила Adriana Castano" },

  folders: [
    {
      tab: { en: "Start", es: "Inicio", ru: "Начало" },
      color: "#f5a623",
      title: { en: "Who Holds the Strings?", es: "¿Quién mueve los hilos?", ru: "Кто дёргает за ниточки?" },
      subtitle: { en: "Leaders and manipulators", es: "Líderes y manipuladores", ru: "Лидеры и манипуляторы" },
      pages: [
        {
          type: "title",
          title: { en: "Who Holds the Strings?", es: "¿Quién mueve los hilos?", ru: "Кто дёргает за ниточки?" },
          subtitle: {
            en: "How to tell a real leader from a manipulator",
            es: "Cómo distinguir a un verdadero líder de un manipulador",
            ru: "Как отличить настоящего лидера от манипулятора"
          }
        },
        {
          type: "text",
          title: { en: "Think of a puppet", es: "Piensa en una marioneta", ru: "Представь марионетку" },
          text: {
            en: "Someone above the puppet pulls the strings. The puppet moves, but it doesn't choose where it goes.",
            es: "Alguien encima de la marioneta tira de los hilos. La marioneta se mueve, pero no elige adónde va.",
            ru: "Кто-то сверху дёргает марионетку за ниточки. Марионетка двигается, но сама не выбирает, куда идти."
          },
          bullets: [
            {
              en: "Have you ever done something because someone pushed you — not because you wanted to?",
              es: "¿Alguna vez has hecho algo porque alguien te presionó, y no porque tú querías?",
              ru: "Вы когда-нибудь делали что-то, потому что на вас давили, а не потому что вы сами этого хотели?"
            },
            {
              en: "Today we will learn how to see the strings.",
              es: "Hoy vamos a aprender a ver los hilos.",
              ru: "Сегодня мы научимся видеть эти ниточки."
            }
          ],
          icon: "dot"
        }
      ]
    },

    {
      tab: { en: "Leaders", es: "Líderes", ru: "Лидеры" },
      color: "#34c759",
      title: { en: "What Is a Leader?", es: "¿Qué es un líder?", ru: "Кто такой лидер?" },
      subtitle: { en: "Someone who helps everyone", es: "Alguien que ayuda a todos", ru: "Тот, кто помогает всем" },
      pages: [
        {
          type: "text",
          title: { en: "What is a leader?", es: "¿Qué es un líder?", ru: "Кто такой лидер?" },
          text: {
            en: "A leader helps a group reach a goal that is good for everyone.",
            es: "Un líder ayuda a un grupo a alcanzar una meta que es buena para todos.",
            ru: "Лидер помогает группе достичь цели, которая хороша для всех."
          },
          bullets: [
            { en: "Listens to everyone", es: "Escucha a todos", ru: "Слушает всех" },
            { en: "Is honest, even when it's hard", es: "Es honesto, incluso cuando es difícil", ru: "Честен, даже когда это трудно" },
            { en: "Shares the credit", es: "Comparte el mérito", ru: "Делится успехом с другими" },
            { en: "Includes people who are left out", es: "Incluye a quienes se quedan fuera", ru: "Принимает тех, кого оставили в стороне" },
            { en: "Lets you say no", es: "Te deja decir que no", ru: "Позволяет тебе сказать «нет»" }
          ],
          icon: "check"
        },
        {
          type: "quotes",
          title: { en: "A leader says...", es: "Un líder dice...", ru: "Лидер говорит..." },
          good: true,
          quotes: [
            { en: "What do you think?", es: "¿Tú qué piensas?", ru: "А ты как думаешь?" },
            { en: "Let's do it together.", es: "Hagámoslo juntos.", ru: "Давай сделаем это вместе." },
            { en: "Great idea — thank you!", es: "¡Buena idea, gracias!", ru: "Отличная идея, спасибо!" },
            { en: "It's okay if you don't want to.", es: "Está bien si no quieres.", ru: "Ничего страшного, если ты не хочешь." }
          ]
        },
        {
          type: "big",
          text: {
            en: "A good leader is happy when other people shine.",
            es: "Un buen líder se alegra cuando los demás brillan.",
            ru: "Хороший лидер радуется, когда другие добиваются успеха."
          },
          small: {
            en: "They don't need to be the loudest or the most popular.",
            es: "No necesita ser el más ruidoso ni el más popular.",
            ru: "Ему не нужно быть самым громким или самым популярным."
          }
        }
      ]
    },

    {
      tab: { en: "Manipulators", es: "Manipuladores", ru: "Манипуляторы" },
      color: "#ff3b30",
      title: { en: "What Is a Manipulator?", es: "¿Qué es un manipulador?", ru: "Кто такой манипулятор?" },
      subtitle: { en: "Someone who pulls the strings", es: "Alguien que mueve los hilos", ru: "Тот, кто дёргает за ниточки" },
      pages: [
        {
          type: "text",
          title: { en: "What is a manipulator?", es: "¿Qué es un manipulador?", ru: "Кто такой манипулятор?" },
          text: {
            en: "A manipulator tries to control people to get what they want. They can look like a leader, but they only care about themselves.",
            es: "Un manipulador intenta controlar a las personas para conseguir lo que quiere. Puede parecer un líder, pero solo se preocupa por sí mismo.",
            ru: "Манипулятор пытается управлять людьми, чтобы получить то, что хочет. Он может выглядеть как лидер, но думает только о себе."
          },
          bullets: [
            { en: "Uses secrets and tricks", es: "Usa secretos y trucos", ru: "Использует секреты и хитрости" },
            { en: "Makes you feel guilty or scared", es: "Te hace sentir culpable o con miedo", ru: "Заставляет тебя чувствовать вину или страх" },
            { en: "Takes the credit", es: "Se queda con el mérito", ru: "Присваивает себе чужой успех" },
            { en: "Leaves people out on purpose", es: "Deja a otros fuera a propósito", ru: "Специально оставляет других в стороне" },
            { en: "Gets angry when you say no", es: "Se molesta cuando dices que no", ru: "Злится, когда ты говоришь «нет»" }
          ],
          icon: "cross"
        },
        {
          type: "quotes",
          title: { en: "A manipulator says...", es: "Un manipulador dice...", ru: "Манипулятор говорит..." },
          good: false,
          quotes: [
            { en: "If you don't do this, you're not my friend.", es: "Si no haces esto, ya no eres mi amigo.", ru: "Если ты этого не сделаешь, ты мне больше не друг." },
            { en: "Don't tell anyone.", es: "No se lo digas a nadie.", ru: "Никому не говори." },
            { en: "Everyone agrees with me.", es: "Todos están de acuerdo conmigo.", ru: "Все со мной согласны." },
            { en: "Don't play with them.", es: "No juegues con ellos.", ru: "Не играй с ними." }
          ]
        },
        {
          type: "text",
          title: { en: "Why is it hard to see?", es: "¿Por qué es difícil de ver?", ru: "Почему это трудно заметить?" },
          text: {
            en: "Manipulators can be friendly, funny and popular. At first it can feel nice to be in their group.",
            es: "Los manipuladores pueden ser simpáticos, divertidos y populares. Al principio puede ser agradable estar en su grupo.",
            ru: "Манипуляторы могут быть дружелюбными, весёлыми и популярными. Сначала быть в их компании может быть приятно."
          },
          bullets: [
            { en: "The strings are hard to see...", es: "Los hilos son difíciles de ver...", ru: "Ниточки трудно увидеть..." },
            { en: "...but they are there.", es: "...pero están ahí.", ru: "...но они есть." }
          ],
          icon: "dot"
        }
      ]
    },

    {
      tab: { en: "Compare", es: "Comparar", ru: "Сравнение" },
      color: "#0a84ff",
      title: { en: "Leader or Manipulator?", es: "¿Líder o manipulador?", ru: "Лидер или манипулятор?" },
      subtitle: { en: "Side by side", es: "Encuentra las diferencias", ru: "Найди отличия" },
      pages: [
        {
          type: "compare",
          title: { en: "Side by side", es: "Encuentra las diferencias", ru: "Найди отличия" },
          left: { en: "Leader", es: "Líder", ru: "Лидер" },
          right: { en: "Manipulator", es: "Manipulador", ru: "Манипулятор" },
          rows: [
            [
              { en: "Goal", es: "La meta", ru: "Цель" },
              { en: "Good for everyone", es: "Buena para todos", ru: "Хорошо для всех" },
              { en: "Good only for me", es: "Buena solo para mí", ru: "Хорошо только для меня" }
            ],
            [
              { en: "Honesty", es: "Honestidad", ru: "Честность" },
              { en: "Open and honest", es: "Abierto y honesto", ru: "Открыто и честно" },
              { en: "Secrets and tricks", es: "Secretos y trucos", ru: "Секреты и хитрости" }
            ],
            [
              { en: "When you say no", es: "Cuando dices que no", ru: "Когда ты говоришь «нет»" },
              { en: "Respects it", es: "Lo respeta", ru: "Уважает это" },
              { en: "Gets angry", es: "Se molesta", ru: "Злится" }
            ],
            [
              { en: "Credit", es: "El mérito", ru: "Успех" },
              { en: "Shares it", es: "Lo comparte", ru: "Делится им" },
              { en: "Takes it", es: "Se lo queda", ru: "Забирает себе" }
            ],
            [
              { en: "Other people", es: "Los demás", ru: "Другие люди" },
              { en: "Brings them in", es: "Los incluye", ru: "Принимает их" },
              { en: "Pushes them out", es: "Los deja fuera", ru: "Отталкивает их" }
            ],
            [
              { en: "You feel...", es: "Tú te sientes...", ru: "Ты чувствуешь себя..." },
              { en: "Safe and free", es: "Seguro y libre", ru: "В безопасности, свободно" },
              { en: "Worried and stuck", es: "Preocupado y atrapado", ru: "Тревожно, как в ловушке" }
            ]
          ]
        },
        {
          type: "big",
          text: { en: "Ask yourself: Who does this help?", es: "Pregúntate: ¿a quién ayuda esto?", ru: "Спроси себя: кому это помогает?" },
          small: {
            en: "If the answer is \"only them\", you may have found a string.",
            es: "Si la respuesta es «solo a esa persona», puede que hayas encontrado un hilo.",
            ru: "Если ответ — «только ему самому», возможно, это и есть ниточка."
          }
        }
      ]
    },

    {
      tab: { en: "Warning Signs", es: "Señales de alerta", ru: "Тревожные знаки" },
      color: "#ff9500",
      title: { en: "Spot the Strings", es: "Descubre los hilos", ru: "Найди ниточки" },
      subtitle: { en: "Warning signs", es: "Señales de alerta", ru: "Тревожные знаки" },
      pages: [
        {
          type: "text",
          title: { en: "Spot the strings", es: "Descubre los hilos", ru: "Найди ниточки" },
          bullets: [
            {
              en: "Guilt: \"After everything I did for you...\"",
              es: "Culpa: «Después de todo lo que hice por ti...»",
              ru: "Давят на чувство вины: «После всего, что я для тебя сделал...»"
            },
            { en: "Too much praise, just to get something", es: "Demasiados elogios, solo para conseguir algo", ru: "Слишком сильно хвалят, чтобы что-то получить" },
            { en: "Threats: \"I'll tell everyone...\"", es: "Amenazas: «Se lo voy a contar a todos...»", ru: "Угрожают: «Я всем расскажу...»" },
            { en: "Secret groups that leave people out", es: "Grupos secretos que dejan a otros fuera", ru: "Создают тайные компании и не пускают других" },
            { en: "Changing the rules so they always win", es: "Cambiar las reglas para ganar siempre", ru: "Меняют правила, чтобы всегда выигрывать" },
            { en: "Making you choose between friends", es: "Hacerte elegir entre tus amigos", ru: "Заставляют выбирать между друзьями" }
          ],
          icon: "cross"
        },
        {
          type: "big",
          text: { en: "Your feelings are a clue.", es: "Tus sentimientos son una pista.", ru: "Твои чувства — это подсказка." },
          small: {
            en: "If you often feel nervous, confused or scared to say no around someone, a string might be pulling you.",
            es: "Si a menudo te sientes nervioso, confundido o con miedo de decir que no cerca de alguien, puede que un hilo te esté moviendo.",
            ru: "Если рядом с кем-то тебе часто тревожно, ты путаешься или боишься сказать «нет», возможно, тебя дёргают за ниточку."
          }
        }
      ]
    },

    {
      tab: { en: "Quiz", es: "Cuestionario", ru: "Викторина" },
      color: "#30b0c7",
      title: { en: "Quiz Time!", es: "¡Hora de jugar!", ru: "Время викторины!" },
      subtitle: { en: "Leader or manipulator?", es: "¿Líder o manipulador?", ru: "Лидер или манипулятор?" },
      pages: [
        {
          type: "quiz",
          title: { en: "Leader or manipulator?", es: "¿Líder o manipulador?", ru: "Лидер или манипулятор?" },
          scenario: {
            en: "\"Let's vote on the game, so everyone gets a say.\"",
            es: "«Votemos qué juego jugar, así todos pueden opinar.»",
            ru: "«Давайте проголосуем, во что играть, чтобы каждый мог высказаться.»"
          },
          answer: "leader",
          why: { en: "Everyone gets to choose.", es: "Todos pueden elegir.", ru: "Каждый может выбрать." }
        },
        {
          type: "quiz",
          title: { en: "Leader or manipulator?", es: "¿Líder o manipulador?", ru: "Лидер или манипулятор?" },
          scenario: {
            en: "\"If you play with them, you can't be in our group.\"",
            es: "«Si juegas con ellos, no puedes estar en nuestro grupo.»",
            ru: "«Если будешь играть с ними, тебе нельзя в нашу компанию.»"
          },
          answer: "manipulator",
          why: { en: "This is a threat. It leaves people out.", es: "Es una amenaza. Deja a otros fuera.", ru: "Это угроза. Так других оставляют в стороне." }
        },
        {
          type: "quiz",
          title: { en: "Leader or manipulator?", es: "¿Líder o manipulador?", ru: "Лидер или манипулятор?" },
          scenario: {
            en: "The team finishes a project. One person tells the teacher: \"I did it all by myself.\"",
            es: "El equipo termina un proyecto. Una persona le dice al profesor: «Lo hice todo yo solo.»",
            ru: "Команда закончила проект. Один человек говорит учителю: «Я всё сделал сам.»"
          },
          answer: "manipulator",
          why: { en: "They take the credit for everyone's work.", es: "Se queda con el mérito del trabajo de todos.", ru: "Он присваивает себе общий труд." }
        },
        {
          type: "quiz",
          title: { en: "Leader or manipulator?", es: "¿Líder o manipulador?", ru: "Лидер или манипулятор?" },
          scenario: {
            en: "Someone sees a new student alone and says: \"Come and sit with us!\"",
            es: "Alguien ve a un estudiante nuevo solo y le dice: «¡Ven a sentarte con nosotros!»",
            ru: "Кто-то видит, что новенький сидит один, и говорит: «Садись с нами!»"
          },
          answer: "leader",
          why: { en: "They bring people in.", es: "Incluye a los demás.", ru: "Он принимает других." }
        },
        {
          type: "quiz",
          title: { en: "Leader or manipulator?", es: "¿Líder o manipulador?", ru: "Лидер или манипулятор?" },
          scenario: {
            en: "\"Don't tell the teacher. It's our secret. You'll be in trouble too.\"",
            es: "«No se lo digas al profesor. Es nuestro secreto. Tú también te vas a meter en problemas.»",
            ru: "«Не говори учителю. Это наш секрет. Тебе тоже попадёт.»"
          },
          answer: "manipulator",
          why: { en: "They use secrets and fear.", es: "Usa secretos y miedo.", ru: "Он использует секреты и страх." }
        },
        {
          type: "quiz",
          title: { en: "Leader or manipulator?", es: "¿Líder o manipulador?", ru: "Лидер или манипулятор?" },
          scenario: {
            en: "\"I don't agree with you, but it's your choice. That's okay.\"",
            es: "«No estoy de acuerdo contigo, pero es tu decisión. Está bien.»",
            ru: "«Я с тобой не согласен, но это твой выбор. Всё в порядке.»"
          },
          answer: "leader",
          why: { en: "They respect your choice.", es: "Respeta tu decisión.", ru: "Он уважает твой выбор." }
        }
      ]
    },

    {
      tab: { en: "Cut the Strings", es: "Corta los hilos", ru: "Обрежь ниточки" },
      color: "#af52de",
      title: { en: "Cut the Strings", es: "Corta los hilos", ru: "Обрежь ниточки" },
      subtitle: { en: "What can we do?", es: "¿Qué podemos hacer?", ru: "Что мы можем сделать?" },
      pages: [
        {
          type: "text",
          title: { en: "What can we do?", es: "¿Qué podemos hacer?", ru: "Что мы можем сделать?" },
          bullets: [
            { en: "Ask: \"Who does this help?\"", es: "Pregunta: «¿A quién ayuda esto?»", ru: "Спроси: «Кому это помогает?»" },
            { en: "Say no — kindly and clearly", es: "Di que no, con amabilidad y claridad", ru: "Говори «нет» — вежливо и чётко" },
            { en: "Stay with friends who make you feel safe", es: "Quédate con amigos que te hacen sentir seguro", ru: "Держись друзей, с которыми тебе спокойно" },
            { en: "Talk to a trusted adult", es: "Habla con un adulto de confianza", ru: "Поговори со взрослым, которому доверяешь" },
            { en: "Don't follow the crowd if the crowd is wrong", es: "No sigas al grupo si el grupo se equivoca", ru: "Не иди за толпой, если толпа неправа" },
            { en: "Be kind to people who are left out", es: "Sé amable con quienes se quedan fuera", ru: "Относись по-доброму к тем, кого оставили в стороне" }
          ],
          icon: "check"
        },
        {
          type: "big",
          text: { en: "Praise the real leaders.", es: "Valora a los verdaderos líderes.", ru: "Цените настоящих лидеров." },
          small: {
            en: "When someone leads in a good way, notice it and say thank you. Good leaders make the whole class stronger.",
            es: "Cuando alguien lidera de buena manera, fíjate y dale las gracias. Los buenos líderes hacen más fuerte a toda la clase.",
            ru: "Когда кто-то ведёт за собой по-хорошему, замечайте это и говорите спасибо. Хорошие лидеры делают весь класс сильнее."
          }
        }
      ]
    },

    {
      tab: { en: "The End", es: "Final", ru: "Конец" },
      color: "#f5a623",
      title: { en: "Remember", es: "Recuerda", ru: "Запомни" },
      subtitle: { en: "The video and goodbye", es: "El video y la despedida", ru: "Видео и прощание" },
      pages: [
        {
          type: "text",
          title: { en: "Remember", es: "Recuerda", ru: "Запомни" },
          bullets: [
            { en: "Leaders lift everyone up.", es: "Los líderes ayudan a todos a crecer.", ru: "Лидеры помогают расти всем." },
            { en: "Manipulators pull strings for themselves.", es: "Los manipuladores mueven los hilos para sí mismos.", ru: "Манипуляторы дёргают за ниточки ради себя." },
            { en: "You can choose who you follow.", es: "Tú puedes elegir a quién seguir.", ru: "Ты можешь выбирать, за кем идти." }
          ],
          icon: "check"
        },
        {
          type: "video",
          title: { en: "Who Holds the Strings?", es: "¿Quién mueve los hilos?", ru: "Кто дёргает за ниточки?" },
          src: "media/who-holds-the-strings.mp4",
          poster: "media/who-holds-the-strings-poster.jpg",
          caption: {
            en: "Watch carefully. Who is really in control?",
            es: "Mira con atención. ¿Quién tiene el control de verdad?",
            ru: "Смотри внимательно. Кто на самом деле всем управляет?"
          }
        },
        {
          type: "text",
          title: { en: "Let's talk about it", es: "Hablemos de esto", ru: "Давайте обсудим" },
          bullets: [
            { en: "Who was pulling the strings?", es: "¿Quién movía los hilos?", ru: "Кто дёргал за ниточки?" },
            { en: "Did the others notice?", es: "¿Los demás se dieron cuenta?", ru: "Заметили ли это остальные?" },
            { en: "How do you think they felt?", es: "¿Cómo crees que se sintieron?", ru: "Как ты думаешь, что они чувствовали?" },
            { en: "What would a real leader do?", es: "¿Qué haría un verdadero líder?", ru: "Что сделал бы настоящий лидер?" }
          ],
          icon: "number"
        },
        {
          type: "title",
          title: { en: "Thank you!", es: "¡Gracias!", ru: "Спасибо!" },
          subtitle: { en: "Be the one who leads with kindness.", es: "Sé quien lidera con bondad.", ru: "Веди за собой с добротой." },
          note: { en: "Any questions?", es: "¿Alguna pregunta?", ru: "Есть вопросы?" }
        }
      ]
    }
  ]
};
