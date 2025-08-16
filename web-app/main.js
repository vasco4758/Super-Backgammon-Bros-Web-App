import R from "./ramda.js";
import Backgammon from "./Backgammon.js";

// Image sources for the checker images
const image_sources = [
    "./assets/mario_checker.png",
    "./assets/goomba_checker.png",
    "./assets/pipe.png",
    "./assets/heart.png",
    "./assets/dice_1.png",
    "./assets/dice_2.png",
    "./assets/dice_3.png",
    "./assets/dice_4.png",
    "./assets/dice_5.png",
    "./assets/dice_6.png"
];

// Alt texts for the checker images
const image_alts = [
    "Mario Checker",
    "Goomba Checker",
    "Pipe",
    "Heart",
    "Die 1",
    "Die 2",
    "Die 3",
    "Die 4",
    "Die 5",
    "Die 6"
];


const el = (id) => document.getElementById(id);

let board_state = Backgammon.new_board();
let first_player_determined = false;
let first_player = null;

const bgMusic = el("mario_theme_audio");

// Play background music on first click
document.addEventListener("click", function startMusic() {
    bgMusic.play();
    document.removeEventListener("click", startMusic);
});

// Show an alert message
function show_alert(message, callback = null) {
    const windowEl = document.getElementById("alert_window");
    const messageEl = document.getElementById("alert_message");
    const closeBtn = document.getElementById("close_alert_button");

    messageEl.textContent = message;

    const close_handler = function () {
        windowEl.classList.remove("show");
        closeBtn.removeEventListener("click", close_handler);
        if (typeof callback === "function") {
            callback();
        }
    };

    const esc_handler = function (e) {
        if (e.key === "Escape") {
            close_handler();
        }
    };

    closeBtn.addEventListener("click", close_handler);
    document.addEventListener("keydown", esc_handler);
    windowEl.classList.add("show");
}

// Create checker images based on the token value.
// If the token is 0, return an empty array.
// If the token is "pipe", return a single pipe image.
// For positive tokens, return that many Mario checker images.
// For negative tokens, return that many Goomba checker images.
const create_checker_images = function (token) {
    if (token === 0) {
        return [];
    }

    if (token === "pipe") {
        const image = document.createElement("img");
        image.setAttribute("src", image_sources[2]);
        image.setAttribute("alt", image_alts[2]);
        image.className = "checker pipe";
        return [image];
    }

    const is_positive = token > 0;
    const src = (
        is_positive
        ? image_sources[0]
        : image_sources[1]
    );
    const alt = (
        is_positive
        ? image_alts[0]
        : image_alts[1]
    );

    return R.range(0, Math.abs(token)).map(function () {
        const image2 = document.createElement("img");
        image2.setAttribute("src", src);
        image2.setAttribute("alt", alt);
        image2.className = "checker";
        return image2;
    });
};


//Get the DOM element representing the checker stack
// at a given point on the board.
const get_checker_stack = function (pointIndex) {
    return document.querySelector(`.checker-stack[data-point="${pointIndex}"]`);
};

/**
 * Render the entire backgammon board based on the current board state.
 * For each point, update its checker stack DOM element
 * with the correct checker images.
 */
const draw_board = function (boardState) {
    const {board, bar} = boardState;

    // Draw checkers on the 24 points
    R.range(0, board.length).forEach(function (pointIndex) {
        const stackElement = get_checker_stack(pointIndex);
        if (stackElement) {
            stackElement.replaceChildren(
                ...create_checker_images(board[pointIndex])
            );
        }
    });

    // Draw checkers on the bar
    const marioBar = document.getElementById("bar_mario");
    const goombaBar = document.getElementById("bar_goomba");

    if (marioBar) {
        marioBar.replaceChildren(...create_checker_images(bar.mario));
    }

    if (goombaBar) {
        goombaBar.replaceChildren(...create_checker_images(-bar.goomba));
    }
};

function render_hearts(player, num_hearts) {
    const container = document.getElementById(`${player}_hearts`);
    container.innerHTML = "";

    const hearts = R.range(0, num_hearts).map(function () {
        const heart = document.createElement("img");
        heart.src = "./assets/heart.png";
        heart.alt = "Heart";
        heart.className = "heart-slot";
        return heart;
    });

    container.append(...hearts);
}

// Reset the ready text for both players
el("mario_ready").textContent = "";
el("goomba_ready").textContent = "";
// Initialize game state variables
let die1 = null;
let die2 = null;
let player;
let turn_finished = true;
let moves_remaining = 0;

// Function to switch turns between players
function switch_turns() {
    turn_finished = true;
    el("dice_image_1").style.display = "none";
    el("dice_image_2").style.display = "none";

    if (player === "mario") {
        player = "goomba";
        el("goomba_ready").textContent = "It's your turn!";
        el("mario_ready").textContent = "Wait your turn.";
    } else {
        player = "mario";
        el("mario_ready").textContent = "It's your turn!";
        el("goomba_ready").textContent = "Wait your turn.";
    }
}

function evaluate_dice_playability(player, dice, board_state) {
    [die1, die2] = dice;
    const possibleMoves = Backgammon.legal_moves_for_player(
        board_state,
        player,
        dice
    );

    if (possibleMoves.length === 0) {
        moves_remaining = 0;
        console.log("No playable moves for player:", player);

        // Show message before switching
        if (player === "mario") {
            el("mario_ready").textContent = "No valid moves, turn skipped.";
            el("goomba_ready").textContent = "It's your turn!";
        } else {
            el("goomba_ready").textContent = "No valid moves, turn skipped.";
            el("mario_ready").textContent = "It's your turn!";
        }

        setTimeout(function () {
            switch_turns();
        }, 2000);
        return;
    }
    const canPlayD1 = Backgammon.legal_moves_for_player(
        board_state,
        player,
        [die1]
    ).length > 0;
    const canPlayD2 = Backgammon.legal_moves_for_player(
        board_state,
        player,
        [die2]
    ).length > 0;

    if (canPlayD1 && canPlayD2) {
        console.log("Both dice playable for player:", player);
        return;
    }

    move_stage = 0;
    console.log("Only 1 die can be played initially by:", player);
    return;
}

// Roll the dice when the button is clicked
// and determine the first player if not already done.
el("roll_dice_button").onclick = function () {
    if (turn_finished === true) {

        if (!first_player_determined) {
            const result = Backgammon.determine_first_player();
            [die1, die2] = result.dice;
            first_player = result.first_player;
            first_player_determined = true;

            player = first_player;

            if (first_player === "mario") {
                el("mario_ready").textContent = "You go first!";
                el("goomba_ready").textContent = "Wait your turn.";
            } else {
                el("goomba_ready").textContent = "You go first!";
                el("mario_ready").textContent = "Wait your turn.";
            }

        } else {
            [die1, die2] = Backgammon.roll_two();
        }

        let dice = [die1, die2];

        if (die1 === die2) {
            dice = [die1, die1, die1, die1];
        }

        moves_remaining = Backgammon.double_roll(die1, die2);

        // Set the src of the image elements based on the rolled values
        el("dice_image_1").src = `./assets/dice_${die1}.png`;
        el("dice_image_2").src = `./assets/dice_${die2}.png`;

        // Set alt text for accessibility
        el("dice_image_1").alt = `Die ${die1}`;
        el("dice_image_2").alt = `Die ${die2}`;

        el("dice_image_1").style.display = "inline";
        el("dice_image_2").style.display = "inline";

        turn_finished = false;
        move_stage = 0;
        evaluate_dice_playability(player, dice, board_state);
    }
};

// Show Instructions
el("instructions_button").onclick = function () {
    el("instructions_window").classList.add("show");
};

// Hide Instructions
el("close_instructions_button").onclick = function () {
    el("instructions_window").classList.remove("show");
};

// Hide on Esc key
document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        el("instructions_window").classList.remove("show");
    }
});

// Initial board setup
draw_board(board_state);
let mario_hearts = 5;
let goomba_hearts = 5;
// Render initial hearts for both players
render_hearts("mario", mario_hearts);
render_hearts("goomba", goomba_hearts);

function hit_opponent(player) {
    if (player === "mario") {
        goomba_hearts -= 1;
        render_hearts("goomba", goomba_hearts);
    } else {
        mario_hearts -= 1;
        render_hearts("mario", mario_hearts);
    }
}

// Initialize game state variables
let move_stage = 0;
let mario_flags = 0;
let goomba_flags = 0;

//Swaps the order of the dice when clicked
// and updates the displayed images accordingly.
function swap_and_render_dice() {
    if (move_stage === 0 && die1 !== null && die2 !== null && die1 !== die2) {
        [die1, die2] = Backgammon.swap_dice(die1, die2);

        el("dice_image_1").src = `./assets/dice_${die1}.png`;
        el("dice_image_2").src = `./assets/dice_${die2}.png`;
        el("dice_image_1").alt = `Die ${die1}`;
        el("dice_image_2").alt = `Die ${die2}`;
    }
}

el("dice_image_1").onclick = swap_and_render_dice;
el("dice_image_2").onclick = swap_and_render_dice;

// Function to end the player's move
// and update the board state accordingly.
function end_player_move() {
    move_stage = 1;
    draw_board(board_state);

    el("mario_pip").textContent = Backgammon.pip_count_for_player(
        board_state.board,
        "mario"
    );
    el("goomba_pip").textContent = Backgammon.pip_count_for_player(
        board_state.board,
        "goomba"
    );

    if (moves_remaining === 0) {
        console.log("End of turn for player:", player);
        switch_turns();
    }
}

// Function to handle game over scenarios
// and update the UI accordingly.
function handle_game_over(outcome) {

    // Update score
    let scoreElementId;
    if (outcome.winner === "mario") {
        scoreElementId = "mario_score";
    } else if (outcome.winner === "goomba") {
        scoreElementId = "goomba_score";
    } else {
        console.log("Unknown winner:", outcome.winner);
        return;
    }
    // Show game over alert
    show_alert(
        outcome.winner.charAt(0).toUpperCase() + outcome.winner.slice(1) +
        " wins the game! Score: " +
        outcome.score +
        " point by " +
        outcome.reason +
        "."
    );

    const currentScore = parseInt(el(scoreElementId).textContent) || 0;
    const newScore = currentScore + (outcome.score || 0);
    el(scoreElementId).textContent = newScore;



    // Reset board and state
    board_state = Backgammon.new_board();
    draw_board(board_state);

    // Reset state variables
    first_player_determined = false;
    first_player = null;
    mario_flags = 0;
    goomba_flags = 0;
    die1 = null;
    die2 = null;
    moves_remaining = 0;
    turn_finished = true;
    move_stage = 0;

    // Reset flag UI positions
    document.getElementById("mario_flag").style.bottom = "0%";
    document.getElementById("goomba_flag").style.bottom = "0%";

    // Restore hearts
    mario_hearts = 5;
    goomba_hearts = 5;
    render_hearts("mario", mario_hearts);
    render_hearts("goomba", goomba_hearts);

    // Hide dice
    el("dice_image_1").style.display = "none";
    el("dice_image_2").style.display = "none";

    // Clear ready text
    el("mario_ready").textContent = "";
    el("goomba_ready").textContent = "";

    el("mario_pip").textContent = 167;
    el("goomba_pip").textContent = 167;
}

// Add click event listeners to checker stacks
document.querySelectorAll(".checker-stack").forEach(function (stackElement) {
    stackElement.onclick = function () {
        if (turn_finished === false) {
            const from_index = parseInt(
                stackElement.getAttribute("data-point"),
                10
            );
            move_stage = 0;

            if (die1 === null || die2 === null) {
                console.log("Roll the dice first!");
                return;
            }

            // Choose the correct die value
            // Choose the correct die value
            let used_die;

            if (die1 === die2) {
                // Doubles: same die used every time
                used_die = die1;
            } else if (moves_remaining % 2 === 0) {
                used_die = die1;
            } else {
                used_die = die2;
            }

            if (board_state.bar[player] > 0) {
                let entry_index;
                if (player === "mario") {
                    entry_index = 24 - used_die;
                } else {
                    entry_index = used_die - 1;
                }

                const entry_point = board_state.board[entry_index];
                const did_hit_bar = (
                    (player === "mario" && entry_point === -1) ||
                    (player === "goomba" && entry_point === 1)
                );

                if (did_hit_bar) {
                    hit_opponent(player);
                    console.log("Opponent hit on re-entry!");
                }

                const new_board_reenter = Backgammon.reenter_from_bar(
                    board_state,
                    player,
                    used_die
                );

                if (new_board_reenter === null) {
                    console.log("Invalid re-entry from bar.");
                    return;
                }
                board_state = new_board_reenter;
                console.log("Re-entered from bar with die:", used_die);
                const outcome = Backgammon.check_game_over(
                    board_state,
                    mario_hearts,
                    goomba_hearts
                );
                if (outcome !== null) {
                    handle_game_over(outcome);
                    return;
                }
                moves_remaining -= 1;
                moves_remaining = Backgammon.check_remaining_dice_playability(
                    die1,
                    die2,
                    used_die,
                    moves_remaining,
                    board_state,
                    player
                );
                move_stage = 1;
                draw_board(board_state);
                el("mario_pip").textContent = Backgammon.pip_count_for_player(
                    board_state.board,
                    "mario"
                );
                el("goomba_pip").textContent = Backgammon.pip_count_for_player(
                    board_state.board,
                    "goomba"
                );
                return;
            }

            if (Backgammon.all_in_home(board_state, player)) {
                const removed = Backgammon.remove_checker(
                    board_state,
                    from_index,
                    used_die,
                    player
                );
                if (removed !== null) {
                    board_state = removed;
                    console.log("Removed one checker for bearing off.");

                    // Count the bearing off
                    if (player === "mario") {
                        mario_flags += 1;
                        document.getElementById("mario_flag").style.bottom = (
                            `${mario_flags * 5.3}%`
                        );
                    } else {
                        goomba_flags += 1;
                        document.getElementById("goomba_flag").style.bottom = (
                            `${goomba_flags * 5.3}%`
                        );
                    }

                    const outcome2 = Backgammon.check_game_over(
                        board_state,
                        mario_hearts,
                        goomba_hearts
                    );
                    if (outcome2 !== null) {
                        handle_game_over(outcome2);
                        return;
                    }

                    moves_remaining -= 1;
                    moves_remaining = (
                        Backgammon.check_remaining_dice_playability(
                            die1,
                            die2,
                            used_die,
                            moves_remaining,
                            board_state,
                            player
                        )
                    );
                    end_player_move();
                    return;
                }
            }

            const new_board_state = Backgammon.move_checker(
                board_state,
                from_index,
                used_die,
                player
            );

            if (new_board_state === null) {
                console.log("Invalid move — try again.");
                return;
            }

            const did_hit = (
                (player === "mario" && (
                    board_state.board[from_index - used_die] === -1
                )) ||
                (player === "goomba" && (
                    board_state.board[from_index + used_die] === 1
                ))
            );

            if (did_hit) {
                hit_opponent(player);
                console.log("Opponent hit!");
            }

            board_state = new_board_state;
            draw_board(board_state);
            console.log(
                "Used die: " + used_die +
                " | Moves remaining: " + moves_remaining
            );

            const outcome_2 = Backgammon.check_game_over(
                board_state,
                mario_hearts,
                goomba_hearts
            );
            if (outcome_2 !== null) {
                handle_game_over(outcome_2);
                return;
            }

            moves_remaining -= 1;
            moves_remaining = Backgammon.check_remaining_dice_playability(
                die1,
                die2,
                used_die,
                moves_remaining,
                board_state,
                player
            );
            end_player_move();
        }
    };
});

let keyboard_navigation_active = false;
let stacks = Array.from(document.querySelectorAll(".checker-stack"));

stacks = stacks.filter(function (stack) {
    return stack.hasAttribute("data-point");
});

// Sort stacks by data-point descending (24, 23, ..., 1, 0)
stacks.sort(function (a, b) {
    return Number(
        (b.getAttribute("data-point")) - Number(a.getAttribute("data-point"))
    );
});

const totalPoints = stacks.length;
let selectedPoint = 0; // index in sorted stacks array

function highlight_selected_point(index) {
    R.addIndex(R.map)(function (stack, i) {
        if (i === index && keyboard_navigation_active) {
            stack.classList.add("selected");
            stack.setAttribute("tabindex", "0");
            stack.focus();
        } else {
            stack.classList.remove("selected");
            stack.removeAttribute("tabindex");
        }
    }, stacks);
}

highlight_selected_point(selectedPoint);

// Keyboard navigation for checker stacks
// Arrow keys to navigate, Enter/Space to select
// 'r' to roll dice, 'i' for instructions, 's' to swap dice
// 'Escape' to close instructions window
document.addEventListener("keydown", function (event) {
    if (el("instructions_window").classList.contains("show")) {
        return;
    }
    if (event.key === "ArrowRight") {
        if (!keyboard_navigation_active) {
            keyboard_navigation_active = true;
        }
        selectedPoint = (selectedPoint + 1) % totalPoints;
        highlight_selected_point(selectedPoint);
        event.preventDefault();
    } else if (event.key === "ArrowLeft") {
        if (!keyboard_navigation_active) {
            keyboard_navigation_active = true;
        }
        selectedPoint = (selectedPoint - 1 + totalPoints) % totalPoints;
        highlight_selected_point(selectedPoint);
        event.preventDefault();
    } else if (event.key === "Enter" || event.key === " ") {
        let stack = stacks[selectedPoint];
        if (stack) {
            stack.click();
        }
        event.preventDefault();
    } else if (event.key === "r" || event.key === "R") {
        el("roll_dice_button").click();
        event.preventDefault();
    } else if (event.key === "i" || event.key === "I") {
        el("instructions_button").click();
        event.preventDefault();
    } else if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        swap_and_render_dice();
    }
});