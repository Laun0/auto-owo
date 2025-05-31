require("dotenv").config();
const fs = require("fs");
const yaml = require("js-yaml");
const { Client } = require("discord.js-selfbot-v13");
const { Signale } = require("signale");

let CONFIG;
try {
  CONFIG = yaml.load(fs.readFileSync("./config.yaml", "utf8"));
} catch (err) {
  console.error("Fatal Error: Could not read or parse config.yaml.", err);
  if (err.name === "YAMLException") {
    console.error(
      "YAML Parsing Error:",
      err.message,
      "at line",
      err.mark.line,
      "column",
      err.mark.column,
    );
  }
  process.exit(1);
}

const loggerOptions = {
  logLevel: CONFIG.loggerLevel || "info",
  scope: "OwO SelfBot",
  displayTimestamp: true,
};
const logger = new Signale(loggerOptions);

let targetChannel;
let isProcessingCaptcha = false;
let captchaAttempts = 0;
let isTakingLongRest = false;
let commandsSinceLastLongRest = 0;
let lastSellAttemptTimestamp = 0;

const owoReportedCooldowns = {};
if (CONFIG.actions) {
  for (const actionName in CONFIG.actions) {
    if (Object.hasOwnProperty.call(CONFIG.actions, actionName)) {
      owoReportedCooldowns[actionName] = 0;
    }
  }
} else {
  logger.warn(
    "CONFIG.actions is not defined in config.yaml! Using default cooldown tracking for hunt, battle, owo.",
  );
  owoReportedCooldowns.hunt = 0;
  owoReportedCooldowns.battle = 0;
  owoReportedCooldowns.owo = 0;
}

let isGrindingActive = false;
const OWO_BOT_ID = CONFIG.botSpecificSettings?.owoBotId || "408785106942164992";
const CAPTCHA_KEYWORDS = CONFIG.botSpecificSettings?.captchaKeywords || [
  "captcha",
  "verify that you are human",
  `please type the following message`,
  `dm me with the following`,
  `slow down!`,
  `you're being too hasty!`,
];
const CHECK_ACTIONS_POOL = CONFIG.botSpecificSettings?.checkActionsPool || [
  "inv",
  "money",
];

const client = new Client({ checkUpdate: false });

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendOwOCommand(commandParts, usePrefix = true) {
  if (!targetChannel) {
    logger.error("Target channel not initialized.");
    return false;
  }
  const commandString = Array.isArray(commandParts)
    ? commandParts.join(" ")
    : commandParts;

  let fullCommand;
  if (commandString === "owo" && !usePrefix) {
    fullCommand = commandString;
  } else {
    fullCommand = usePrefix
      ? `${CONFIG.owoPrefix} ${commandString}`
      : commandString;
  }

  if (!isGrindingActive) {
    logger.info(`Command "${fullCommand}" not sent, grinding is not active.`);
    return false;
  }
  if (isProcessingCaptcha) {
    logger.warn(
      `Command "${fullCommand}" delayed due to CAPTCHA (grinding active).`,
    );
    return false;
  }
  if (isTakingLongRest) {
    logger.info(
      `Command "${fullCommand}" delayed due to long rest (grinding active).`,
    );
    return false;
  }

  try {
    await targetChannel.send(fullCommand);
    logger.info(`Sent: ${fullCommand}`);
    if (isGrindingActive) commandsSinceLastLongRest++;
    return true;
  } catch (err) {
    logger.error(`Failed to send "${fullCommand}": ${err.message || err}`);
    return false;
  }
}

async function executeCheckActions() {
  if (!isGrindingActive || CHECK_ACTIONS_POOL.length === 0) return;

  if (Math.random() < (CONFIG.behavior?.chanceToRunCheckAction || 0.1)) {
    const chosenCheck =
      CHECK_ACTIONS_POOL[getRandomInt(0, CHECK_ACTIONS_POOL.length - 1)];

    let commandForLog;
    if (Array.isArray(chosenCheck)) {
      commandForLog = chosenCheck.join(" ");
    } else {
      commandForLog = chosenCheck;
    }

    logger.debug(`Performing a random check action: ${commandForLog}`);
    await sendOwOCommand(chosenCheck);
    await wait(
      getRandomInt(
        CONFIG.intervals?.minorActionDelayMin || 1000,
        CONFIG.intervals?.minorActionDelayMax || 2000,
      ),
    );
  }
}

async function executeSellActions() {
  if (
    !isGrindingActive ||
    !CONFIG.autoSell?.enabled ||
    !CONFIG.autoSell?.raritiesToSell ||
    CONFIG.autoSell.raritiesToSell.length === 0
  )
    return;

  if (
    Math.random() < (CONFIG.behavior?.chanceToRunSellAction || 0.05) &&
    Date.now() - lastSellAttemptTimestamp >
      (CONFIG.autoSell?.sellCheckInterval || 3600000)
  ) {
    logger.info("Attempting to sell items...");
    for (const rarity of CONFIG.autoSell.raritiesToSell) {
      if (!isGrindingActive || isProcessingCaptcha || isTakingLongRest) break;
      await sendOwOCommand(["sell", "all", rarity]);
      await wait(
        getRandomInt(
          CONFIG.intervals?.minorActionDelayMin || 2000,
          CONFIG.intervals?.minorActionDelayMax || 4000,
        ),
      );
    }
    lastSellAttemptTimestamp = Date.now();
  }
}

async function takeLongRestIfNeeded() {
  if (
    isGrindingActive &&
    commandsSinceLastLongRest >=
      (CONFIG.behavior?.commandsBeforeLongRest || 150) &&
    !isTakingLongRest
  ) {
    isTakingLongRest = true;
    const restDuration = getRandomInt(
      CONFIG.behavior?.minLongRestDuration || 300000,
      CONFIG.behavior?.maxLongRestDuration || 900000,
    );
    logger.warn(
      `Taking a long rest for ${Math.round(restDuration / 60000)} minutes. Commands since last rest: ${commandsSinceLastLongRest}`,
    );
    await wait(restDuration);
    commandsSinceLastLongRest = 0;
    isTakingLongRest = false;
    logger.success("Resumed activity after long rest.");
  }
}

async function mainGrindLoop() {
  if (!isGrindingActive) {
    logger.info("mainGrindLoop: Grinding is not active. Loop will not run.");
    return;
  }

  if (isProcessingCaptcha || isTakingLongRest) {
    const checkInterval = isProcessingCaptcha ? 7000 : 60000;
    setTimeout(mainGrindLoop, checkInterval);
    return;
  }

  await takeLongRestIfNeeded();
  if (isTakingLongRest) {
    setTimeout(mainGrindLoop, 60000);
    return;
  }

  let now = Date.now();
  const minorDelayMin = CONFIG.intervals?.minorActionDelayMin || 1000;
  const minorDelayMax = CONFIG.intervals?.minorActionDelayMax || 3000;

  if (
    CONFIG.actions?.hunt?.enabled &&
    now >= (owoReportedCooldowns.hunt || 0)
  ) {
    if (!isGrindingActive || isProcessingCaptcha || isTakingLongRest) {
      if (isGrindingActive) setTimeout(mainGrindLoop, 5000);
      return;
    }
    logger.debug("Attempting to hunt...");
    await sendOwOCommand("hunt");
    await wait(getRandomInt(minorDelayMin, minorDelayMax));
  }

  now = Date.now();
  if (
    CONFIG.actions?.battle?.enabled &&
    now >= (owoReportedCooldowns.battle || 0)
  ) {
    if (!isGrindingActive || isProcessingCaptcha || isTakingLongRest) {
      if (isGrindingActive) setTimeout(mainGrindLoop, 5000);
      return;
    }
    logger.debug("Attempting to battle...");
    await sendOwOCommand("battle");
    await wait(getRandomInt(minorDelayMin, minorDelayMax));
  }

  now = Date.now();
  if (CONFIG.actions?.owo?.enabled && now >= (owoReportedCooldowns.owo || 0)) {
    if (!isGrindingActive || isProcessingCaptcha || isTakingLongRest) {
      if (isGrindingActive) setTimeout(mainGrindLoop, 5000);
      return;
    }
    logger.debug("Attempting to 'owo'...");
    await sendOwOCommand("owo", false);
  }

  if (!isGrindingActive) {
    logger.info("Grinding stopped during main action phase.");
    return;
  }
  await executeCheckActions();
  if (!isGrindingActive) {
    logger.info("Grinding stopped during check phase.");
    return;
  }
  await executeSellActions();
  if (!isGrindingActive) {
    logger.info("Grinding stopped during sell phase.");
    return;
  }

  let nextMainDelay = getRandomInt(
    CONFIG.intervals?.minGrindAction || 15000,
    CONFIG.intervals?.maxGrindAction || 18000,
  );
  let maxOwoCooldownActive = 0;

  for (const type in owoReportedCooldowns) {
    if (
      Object.hasOwnProperty.call(owoReportedCooldowns, type) &&
      owoReportedCooldowns[type] > Date.now()
    ) {
      maxOwoCooldownActive = Math.max(
        maxOwoCooldownActive,
        owoReportedCooldowns[type] - Date.now(),
      );
    }
  }

  if (maxOwoCooldownActive > 0) {
    logger.debug(
      `OwO cooldown still active. Adjusting next main cycle delay. Min OwO cooldown: ${Math.round(maxOwoCooldownActive / 1000)}s.`,
    );
    nextMainDelay = Math.max(
      nextMainDelay,
      maxOwoCooldownActive + getRandomInt(1000, 2500),
    );
  }

  if (isGrindingActive) {
    logger.debug(
      `Next main grind cycle in ${Math.round(nextMainDelay / 1000)} seconds.`,
    );
    setTimeout(mainGrindLoop, nextMainDelay);
  } else {
    logger.info(
      "mainGrindLoop: Grinding stopped. Next cycle will not be scheduled.",
    );
  }
}

client.on("ready", async () => {
  logger.success(`Logged in as ${client.user.username}!`);
  logger.info("Self-bot is active. config.yaml loaded.");
  logger.info(
    `OwO prefix: "${CONFIG.owoPrefix || "owo"}". Bot control prefix: "${CONFIG.botControlPrefix || "ERROR: botControlPrefix not set!"}"`,
  );
  logger.info(`OwO Bot ID from config: ${OWO_BOT_ID}`);
  logger.info(
    `Send "${CONFIG.botControlPrefix || "[CONTROL_PREFIX]"}start" in the target channel to begin grinding.`,
  );
  logger.fatal(
    "CRITICAL WARNING: Using self-bots violates Discord ToS & OwO Bot rules. Your account is at EXTREME RISK of being banned.",
  );

  try {
    targetChannel = await client.channels.fetch(CONFIG.channelId);
    if (!targetChannel || !targetChannel.send) {
      logger.error(
        `Channel with ID ${CONFIG.channelId} not found or cannot send messages. Exiting.`,
      );
      process.exit(1);
    }
    logger.info(
      `Targeting channel: #${targetChannel.name} (${targetChannel.id})`,
    );

    if ((CONFIG.intervals?.pray || 0) > 0) {
      setInterval(
        async () => {
          if (isGrindingActive && !isProcessingCaptcha && !isTakingLongRest)
            await sendOwOCommand("pray");
        },
        (CONFIG.intervals?.pray || 300000) + getRandomInt(0, 10000),
      );
      logger.info(
        `Pray command scheduling active (will run if grinding is started).`,
      );
    }

    if (
      CONFIG.curse?.enabled &&
      (CONFIG.curse?.interval || 0) > 0 &&
      CONFIG.curse?.targetUserId
    ) {
      setInterval(
        async () => {
          if (isGrindingActive && !isProcessingCaptcha && !isTakingLongRest)
            await sendOwOCommand(["curse", CONFIG.curse.targetUserId]);
        },
        (CONFIG.curse?.interval || 300000) + getRandomInt(0, 10000),
      );
      logger.info(
        `Curse command scheduling active (will run if grinding is started).`,
      );
    }

    if ((CONFIG.intervals?.daily || 0) > 0) {
      setInterval(
        async () => {
          if (isGrindingActive && !isProcessingCaptcha && !isTakingLongRest)
            await sendOwOCommand("daily");
        },
        (CONFIG.intervals?.daily || 86400000) + getRandomInt(0, 60000 * 5),
      );
      logger.info(
        `Daily command scheduling active (will run if grinding is started).`,
      );
    }
  } catch (error) {
    logger.error("Fatal error during setup:", error);
    process.exit(1);
  }
});

client.on("messageCreate", async (message) => {
  if (message.author.id === client.user.id) {
    const commandInput = message.content.toLowerCase();
    const controlPrefix = CONFIG.botControlPrefix;

    if (!controlPrefix) {
      logger.error(
        "botControlPrefix is not defined in config.yaml. Cannot process control commands.",
      );
      return;
    }

    if (commandInput === `${controlPrefix}start`) {
      if (isGrindingActive) {
        logger.info("Grinding is already active.");
        message
          .reply("Grinding sudah aktif.")
          .catch((e) => logger.error("Reply failed:", e.message));
      } else {
        isGrindingActive = true;
        isProcessingCaptcha = false;
        isTakingLongRest = false;
        captchaAttempts = 0;
        commandsSinceLastLongRest = 0;
        logger.success("Grinding started by command.");
        message
          .reply("Grinding dimulai! OwO")
          .catch((e) => logger.error("Reply failed:", e.message));
        mainGrindLoop();
      }
      return;
    }

    if (commandInput === `${controlPrefix}stop`) {
      if (!isGrindingActive) {
        logger.info("Grinding is already stopped.");
        message
          .reply("Grinding sudah berhenti.")
          .catch((e) => logger.error("Reply failed:", e.message));
      } else {
        isGrindingActive = false;
        logger.warn("Grinding stopped by command.");
        message
          .reply("Grinding dihentikan! :(")
          .catch((e) => logger.error("Reply failed:", e.message));
      }
      return;
    }

    if (commandInput === `${controlPrefix}status`) {
      let statusMessage = `**Bot Status (using prefix: ${controlPrefix}):**\n`;
      statusMessage += `Grinding Active: ${isGrindingActive ? "✅ Yes" : "❌ No"}\n`;
      statusMessage += `Processing Captcha: ${isProcessingCaptcha ? "⚠️ Yes" : "❌ No"}\n`;
      statusMessage += `Captcha Attempts: ${captchaAttempts}/${CONFIG.captcha?.maxAttemptsBeforeLongPause || 3}\n`;
      statusMessage += `Taking Long Rest: ${isTakingLongRest ? "休憩 Yes" : "❌ No"}\n`;
      statusMessage += `Commands Since Last Rest: ${commandsSinceLastLongRest}/${CONFIG.behavior?.commandsBeforeLongRest || 150}\n`;
      logger.info(
        `Status requested: Active=${isGrindingActive}, Captcha=${isProcessingCaptcha}, Rest=${isTakingLongRest}`,
      );
      message
        .reply(statusMessage)
        .catch((e) => logger.error("Reply failed:", e.message));
      return;
    }

    if (commandInput === `${controlPrefix}captchadone`) {
      if (isProcessingCaptcha) {
        isProcessingCaptcha = false;
        captchaAttempts = 0;
        logger.success("CAPTCHA flag manually reset.");
        message
          .reply(
            `Flag captcha direset. Gunakan '${controlPrefix}start' jika grinding perlu dimulai lagi dan tidak sedang dalam punishment pause.`,
          )
          .catch((e) => logger.error("Reply failed:", e.message));
        if (isGrindingActive && !isTakingLongRest) {
          logger.info("Restarting mainGrindLoop after captcha reset.");
          mainGrindLoop();
        }
      } else {
        logger.info(
          `'${controlPrefix}captchadone' received, but no CAPTCHA was active.`,
        );
        message
          .reply("Tidak ada captcha yang aktif saat ini.")
          .catch((e) => logger.error("Reply failed:", e.message));
      }
      return;
    }
  }

  if (
    message.author.id === OWO_BOT_ID &&
    message.channel.id === CONFIG.channelId
  ) {
    const content = message.content.toLowerCase();
    const ownUsername = client.user.username.toLowerCase();

    if (
      isGrindingActive &&
      CAPTCHA_KEYWORDS.some((keyword) => content.includes(keyword)) &&
      (content.includes(ownUsername) ||
        !content.includes(" dm ") ||
        CAPTCHA_KEYWORDS.some(
          (k) =>
            (k === "slow down!" || k === "you're being too hasty!") &&
            content.includes(k),
        ))
    ) {
      isProcessingCaptcha = true;
      captchaAttempts++;
      logger.alarm(
        "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!",
      );
      logger.alarm(
        "!!! CAPTCHA / VERIFICATION / RATE LIMIT DETECTED from OwO Bot !!!",
      );
      logger.alarm(
        `!!! Attempts: ${captchaAttempts}/${CONFIG.captcha?.maxAttemptsBeforeLongPause || 3} !!! Message: ${message.content} !!!`,
      );
      logger.alarm(
        "!!! PLEASE RESOLVE MANUALLY IN DISCORD OR WAIT FOR BOT TO PAUSE !!!",
      );
      logger.alarm(
        "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!",
      );
      if (targetChannel)
        targetChannel
          .send(
            `@here DETECTED CAPTCHA/RATE LIMIT! Count: ${captchaAttempts}. Resolve & type \`${CONFIG.botControlPrefix || "[CP]"}captchadone\`. Message: \`\`\`${message.content.substring(0, 1500)}\`\`\``,
          )
          .catch((e) =>
            logger.error("Failed to send CAPTCHA alert to channel:", e.message),
          );

      if (
        captchaAttempts >= (CONFIG.captcha?.maxAttemptsBeforeLongPause || 3)
      ) {
        logger.fatal(
          `Max captcha/rate-limit attempts reached. Forcing a long pause for ${Math.round((CONFIG.captcha?.pauseDurationAfterMaxAttempts || 1800000) / 60000)} minutes.`,
        );
        isTakingLongRest = true;
        commandsSinceLastLongRest =
          (CONFIG.behavior?.commandsBeforeLongRest || 150) + 1;
        if (targetChannel)
          targetChannel
            .send(
              `@here MAX CAPTCHA ATTEMPTS. Bot entering long pause for ~${Math.round((CONFIG.captcha?.pauseDurationAfterMaxAttempts || 1800000) / 60000)} mins. Grinding will be inactive.`,
            )
            .catch((e) =>
              logger.error("Failed to send CAPTCHA pause alert:", e.message),
            );

        setTimeout(() => {
          logger.info(
            "Captcha punishment pause finished. Resetting captcha attempts.",
          );
          isTakingLongRest = false;
          isProcessingCaptcha = false;
          captchaAttempts = 0;
          commandsSinceLastLongRest = 0;
          if (isGrindingActive) {
            logger.info("Restarting mainGrindLoop after punishment pause.");
            mainGrindLoop();
          } else {
            logger.info(
              "Grinding is not active after punishment pause. Awaiting 'start' command with prefix: " +
                (CONFIG.botControlPrefix || "[CP]"),
            );
          }
        }, CONFIG.captcha?.pauseDurationAfterMaxAttempts || 1800000);
      }
      return;
    }

    const tiredHuntMatch =
      content.match(/you are too tired to hunt! you must wait (\d+)s/i) ||
      content.match(
        /you found an animal, but you are too tired to catch it! you must wait (\d+)s/i,
      );
    if (
      tiredHuntMatch &&
      tiredHuntMatch[1] &&
      Object.hasOwnProperty.call(owoReportedCooldowns, "hunt")
    ) {
      const cooldownSeconds = parseInt(tiredHuntMatch[1], 10);
      owoReportedCooldowns.hunt =
        Date.now() + cooldownSeconds * 1000 + getRandomInt(1000, 2000);
      logger.info(
        `OwO reported HUNT cooldown: ${cooldownSeconds}s. Next hunt: ${new Date(owoReportedCooldowns.hunt).toLocaleTimeString()}`,
      );
    }

    const tiredBattleMatch = content.match(
      /you are too tired to battle! you must wait (\d+)s/i,
    );
    if (
      tiredBattleMatch &&
      tiredBattleMatch[1] &&
      Object.hasOwnProperty.call(owoReportedCooldowns, "battle")
    ) {
      const cooldownSeconds = parseInt(tiredBattleMatch[1], 10);
      owoReportedCooldowns.battle =
        Date.now() + cooldownSeconds * 1000 + getRandomInt(1000, 2000);
      logger.info(
        `OwO reported BATTLE cooldown: ${cooldownSeconds}s. Next battle: ${new Date(owoReportedCooldowns.battle).toLocaleTimeString()}`,
      );
    }
  }
});

client.on("error", (error) => {
  logger.error("Discord Client Error:", error);
});

const discordToken = process.env.DISCORD_TOKEN;
if (!discordToken) {
  logger.fatal(
    "DISCORD_TOKEN not found in .env file or is empty. Please create/check your .env file. Exiting.",
  );
  process.exit(1);
}

client.login(discordToken).catch((err) => {
  logger.fatal("LOGIN FAILED:", err.message || err);
  if (
    String(err.message).includes("Incorrect login details") ||
    String(err.message).includes("Invalid Token")
  ) {
    logger.error(
      "Make sure your DISCORD_TOKEN in .env is correct, valid, and for a USER account (not a bot token).",
    );
  }
  process.exit(1);
});

process.on("SIGINT", () => {
  logger.warn("SIGINT received. Shutting down gracefully...");
  if (client && typeof client.destroy === "function") {
    client.destroy();
  }
  process.exit(0);
});
