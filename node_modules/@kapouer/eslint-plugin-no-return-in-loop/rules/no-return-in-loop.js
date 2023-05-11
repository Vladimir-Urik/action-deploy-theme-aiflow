/**
 * @fileoverview Rule to disallow uses of await inside of loops.
 * @author Jérémy Lal (kapouer)
 */
"use strict";

/**
 * Check whether it should stop traversing ancestors at the given node.
 * @param {ASTNode} node A node to check.
 * @returns {boolean} `true` if it should stop traversing.
 */
function isBoundary(node) {
	const t = node.type;

	return (
		t === "FunctionDeclaration" ||
				t === "FunctionExpression" ||
				t === "ArrowFunctionExpression" ||

				/*
				 * Don't report the await expressions on for-await-of loop since it's
				 * asynchronous iteration intentionally.
				 */
				(t === "ForOfStatement" && node.await === true)
	);
}

/**
 * Check whether the given node is in loop.
 * @param {ASTNode} node A node to check.
 * @param {ASTNode} parent A parent node to check.
 * @returns {boolean} `true` if the node is in loop.
 */
function isLooped(node, parent) {
	switch (parent.type) {
		case "ForStatement":
			return (
				node === parent.test ||
								node === parent.update ||
								node === parent.body
			);

		case "ForOfStatement":
		case "ForInStatement":
			return node === parent.body;

		case "WhileStatement":
		case "DoWhileStatement":
			return node === parent.test || node === parent.body;

		default:
			return false;
	}
}

module.exports = {
	meta: {
		type: "problem",
		fixable: "code",
		docs: {
			description: "disallow `return` without arguments inside loops",
			recommended: true,
			url: "https://eslint.org/docs/rules/no-return-in-loop"
		},

		schema: [],

		messages: {
			unexpectedReturn: "Unexpected `return` inside a loop."
		}
	},
	create(context) {

		/**
		 * Validate a return expression.
		 * @param {ASTNode} node A ReturnStatement node to validate.
		 * @returns {void}
		 */
		function validate(node) {
			if (node.argument) return;
			let child = node;
			let parent = node.parent;

			while (parent && !isBoundary(parent)) {
				if (isLooped(child, parent)) {
					context.report({
						node,
						messageId: "unexpectedReturn",
						fix: (fixer) => {
							const asi = context.getSourceCode().getText(node).endsWith(';');
							return fixer.replaceText(node, 'continue' + (asi ? ';' : ''));
						}
					});
					return;
				}
				child = parent;
				parent = parent.parent;
			}
		}
		return {
			ReturnStatement: validate
		};
	}
};
