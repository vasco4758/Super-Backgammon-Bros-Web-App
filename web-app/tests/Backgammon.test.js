import Backgammon from "../Backgammon.js";
import assert from "assert";

let board_state;

describe("Checker moves correctly", function () {

    it(
        "Should move a checker from one point to another empty point",
        function () {
            board_state = Backgammon.new_board();
            board_state.board[23] = 1;
            board_state.board[19] = 0;

            const initial_count = board_state.board[23];
            const result = Backgammon.move_checker(board_state, 23, 4, "mario");

            assert.notStrictEqual(result, null, "Move should be valid");
            assert.strictEqual(
                result.board[19],
                1,
                "Checker should be at destination"
            );
            assert.strictEqual(
                result.board[23],
                initial_count - 1,
                "Source should have one less checker"
            );
        }
    );

    it("Should move a checker to a point with same checkers", function () {
        board_state = Backgammon.new_board();
        board_state.board[23] = 1;
        board_state.board[19] = 2;

        const result = Backgammon.move_checker(board_state, 23, 4, "mario");
        const destination_checkers = 3;

        assert.notStrictEqual(result, null, "Move should be valid");
        assert.strictEqual(
            result.board[19],
            destination_checkers,
            "Destination should have 3 mario checkers"
        );
    });

    it(
        "Should move a checker to a point with 1 lone opponent checker",
        function () {
            board_state = Backgammon.new_board();
            board_state.board[23] = 1;
            board_state.board[19] = -1;

            const result = Backgammon.move_checker(board_state, 23, 4, "mario");

            assert.notStrictEqual(result, null, "Move should be valid");
            assert.strictEqual(
                result.bar.goomba,
                1,
                "Goomba checker should be on bar"
            );
            assert.strictEqual(
                result.board[19],
                1,
                "Mario checker should occupy the point"
            );
        }
    );

    it("Opponent checkers should not move during your turn", function () {
        board_state = Backgammon.new_board();
        board_state.board[0] = -1;

        const result = Backgammon.move_checker(board_state, 0, 3, "mario");

        assert.strictEqual(
            result,
            null,
            "Should not be able to move opponent's checker"
        );
    });

    it("Pipe never moves", function () {
        board_state = Backgammon.new_board();
        const pipe_index = board_state.board.findIndex((val) => val === "pipe");
        const result = Backgammon.move_checker(
            board_state,
            pipe_index,
            1,
            "mario"
        );

        assert.strictEqual(result, null, "Pipe should not be moveable");
    });

    it("Checkers can't land on pipe", function () {
        board_state = Backgammon.new_board();
        const pipe_index = board_state.board.findIndex((val) => val === "pipe");

        let source_index = pipe_index + 1;
        if (source_index >= 24) {
            source_index = pipe_index - 1;
        }

        board_state.board[source_index] = 1;

        const result = Backgammon.move_checker(
            board_state,
            source_index,
            1,
            "mario"
        );

        assert.strictEqual(result, null, "Should not be able to land on pipe");
    });

    it(
        "Checkers should not move to a point occupied by 2+ opponent checkers",
        function () {
            board_state = Backgammon.new_board();
            board_state.board[23] = 1;
            board_state.board[19] = -2;

            const result = Backgammon.move_checker(board_state, 23, 4, "mario");

            assert.strictEqual(
                result,
                null,
                "Should not be able to move to blocked point"
            );
        }
    );
});

describe("Dice rolls correctly", function () {
    it("Swapping dice works", function () {
        const original = [3, 5];
        const swapped = Backgammon.swap_dice(original[0], original[1]);

        assert.strictEqual(swapped[0], original[1]);
        assert.strictEqual(swapped[1], original[0]);
    });

    it("Double rolls produce 4 moves", function () {
        const moves = Backgammon.double_roll(5, 5);
        assert.strictEqual(moves, 4);
    });

    it("Regular rolls produce 2 moves", function () {
        const moves = Backgammon.double_roll(3, 5);
        assert.strictEqual(moves, 2);
    });

    it("First player determination works", function () {
        const result = Backgammon.determine_first_player();

        assert.ok(
            result.first_player === "mario" || result.first_player === "goomba"
        );
        assert.ok(Array.isArray(result.dice));
        assert.strictEqual(result.dice.length, 2);
        assert.notStrictEqual(
            result.dice[0],
            result.dice[1],
            "Should not be doubles"
        );
    });
});

describe("End game works", function () {

    it("Goomba wins by hearts", function () {
        board_state = Backgammon.new_board();
        const result = Backgammon.check_game_over(board_state, 0, 3);

        assert.notStrictEqual(result, null);
        assert.strictEqual(result.winner, "goomba");
        assert.strictEqual(result.reason, "KO");
    });

    it("Mario wins by hearts", function () {
        board_state = Backgammon.new_board();
        const result = Backgammon.check_game_over(board_state, 3, 0);

        assert.notStrictEqual(result, null);
        assert.strictEqual(result.winner, "mario");
        assert.strictEqual(result.reason, "KO");
    });

    it("Goomba wins by bearing off all checkers", function () {
        board_state = Backgammon.new_board();
        board_state.board = board_state.board.map(function (val) {
            if (val === "pipe") {
                return val;
            }
            return (
                (val < 0)
                ? 0
                : val
            );
        });
        board_state.bar.goomba = 0;
        board_state.borne_off.goomba = 15;

        const result = Backgammon.check_game_over(board_state, 3, 3);

        assert.notStrictEqual(result, null);
        assert.strictEqual(result.winner, "goomba");
        assert.strictEqual(result.reason, "bear-off");
    });

    it("Mario wins by bearing off all checkers", function () {
        board_state = Backgammon.new_board();
        board_state.board = board_state.board.map(function (val) {
            if (val === "pipe") {
                return val;
            }
            return (
                (val > 0)
                ? 0
                : val
            );
        });
        board_state.bar.mario = 0;
        board_state.borne_off.mario = 15;

        const result = Backgammon.check_game_over(board_state, 3, 3);

        assert.notStrictEqual(result, null);
        assert.strictEqual(result.winner, "mario");
        assert.strictEqual(result.reason, "bear-off");
    });

    it("Game continues when no win condition is met", function () {
        board_state = Backgammon.new_board();
        const result = Backgammon.check_game_over(board_state, 3, 3);

        assert.strictEqual(result, null);
    });
});

describe("Scoring works", function () {

    it("1 point for heart win", function () {
        board_state = Backgammon.new_board();
        const result = Backgammon.check_game_over(board_state, 0, 3);
        assert.strictEqual(result.score, 1);
    });

    it("1 point if opponent has borne off a checker", function () {
        board_state = Backgammon.new_board();
        board_state.board = board_state.board.map(function (val) {
            return (
                (val > 0)
                ? 0
                : val
            );
        });
        board_state.bar.mario = 0;
        board_state.borne_off.mario = 15;
        board_state.borne_off.goomba = 1;

        const result = Backgammon.check_game_over(board_state, 3, 3);

        assert.strictEqual(result.score, 1);
    });

    it("3 points if opponent is in winner's home board or on bar", function () {
        board_state = Backgammon.new_board();
        board_state.board = board_state.board.map(function (val) {
            return (
                (val > 0)
                ? 0
                : val
            );
        });
        board_state.board[2] = -1;
        board_state.bar.mario = 0;
        board_state.borne_off.mario = 15;
        board_state.borne_off.goomba = 0;

        const result = Backgammon.check_game_over(board_state, 3, 3);

        assert.strictEqual(result.score, 3);
    });

    it(
        "2 points if opponent hasn't borne off and isn't in home board",
        function () {
            board_state = Backgammon.new_board();
            board_state.board = new Array(24).fill(0);
            board_state.bar = {mario: 0, goomba: 0};
            board_state.borne_off = {mario: 15, goomba: 0};

            const result = Backgammon.check_game_over(board_state, 3, 3);

            assert.strictEqual(result.score, 2);
        }
    );
});

describe("Additional functional tests", function () {

    it("Should calculate pip count correctly", function () {
        board_state = Backgammon.new_board();
        const correct_pip_count = 167; // Example pip count for a standard board
        const mario_pips = Backgammon.pip_count_for_player(
            board_state.board,
            "mario"
        );
        const goomba_pips = Backgammon.pip_count_for_player(
            board_state.board,
            "goomba"
        );

        assert.ok(
            mario_pips === correct_pip_count,
            "Mario should have positive pip count"
        );
        assert.ok(
            goomba_pips === correct_pip_count,
            "Goomba should have positive pip count"
        );
    });

    it("Should detect when all checkers are in home", function () {
        board_state = Backgammon.new_board();
        board_state.board.fill(0);
        board_state.board[0] = 15;
        board_state.bar.mario = 0;

        const result = Backgammon.all_in_home(board_state, "mario");
        assert.strictEqual(result, true);
    });

    it("Should allow re-entry from bar", function () {
        board_state = Backgammon.new_board();
        board_state.bar.mario = 1;
        board_state.board[23] = 0;
        const empty_bar = 0;
        const one_checker_23 = 1;
        const result = Backgammon.reenter_from_bar(board_state, "mario", 1);

        assert.notStrictEqual(result, null);
        assert.strictEqual(result.bar.mario, empty_bar);
        assert.strictEqual(result.board[23], one_checker_23);
    });

    it("Should generate legal moves", function () {
        board_state = Backgammon.new_board();
        const moves = Backgammon.legal_moves_for_player(
            board_state,
            "mario",
            [3, 5]
        );

        assert.ok(Array.isArray(moves));
        assert.ok(moves.length > 0, "Should have some legal moves");

        if (moves.length > 0) {
            const move = moves[0];
            assert.ok(typeof move.from === "number" || move.from === "bar");
            assert.ok(typeof move.to === "number" || move.to === "borne_off");
            assert.ok(typeof move.die === "number");
        }
    });

    it("Should check remaining dice playability", function () {
        board_state = Backgammon.new_board();
        const remaining = Backgammon.check_remaining_dice_playability(
            3,
            5,
            3,
            1,
            board_state,
            "mario"
        );

        assert.ok(typeof remaining === "number");
        assert.ok(remaining >= 0);
    });
});