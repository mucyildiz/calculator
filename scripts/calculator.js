const isOperator = element => '*/-+()'.includes(element);
const isNumber = element => !isNaN(element);

/**
 * @param {string} input
 * @description Ensures that the input is clean, meaning there exist no irrelevant elements in the input. 
 * Note that another form of invalid input is one where we have more operators than we can use - this is checked for in evaluateExpression
 */
 const validateInput = input => {
	//check parentheses line up
	let parenthesesTracker = 0;
	for(chr of input){
		if(chr === '('){
			parenthesesTracker++;
		}
		else if(chr === ')'){
			parenthesesTracker--;
			// should never have more right parentheses than left
			if(parenthesesTracker < 0) {
				throw new Error("Invalid Input");
			}
		}
	}
	if(parenthesesTracker !== 0) {
		throw new Error("Invalid Input");
	}
	const inputWithoutSpaces = input.replace(/\s+/g, '');
	const allowedElements = "1234567890.()*/-+";
	for(let char of inputWithoutSpaces) {
		if(!allowedElements.includes(char)){
				throw new Error("Invalid Input");
		}
	}
}

/**
 * @param {string} input BEFORE it is converted to postfix notation
 * @description takes string expression and outputs array with each token having its own index in the array
 * allows us to have decimal values and greater than single digit values
 * @returns {Array} 
 */
 const getArrayOfTokens = input => {
	const inputWithoutSpaces = input.replace(/\s+/g, '');
	const inputArray = inputWithoutSpaces.split('');
	const tokenArray = [];
	for(let i = 0; i < inputArray.length; i++) {
		let currToken = inputArray[i];
		if(isOperator(currToken)) {
			tokenArray.push(currToken)
		}
		else{
			while(i < inputArray.length - 1 && !isOperator(inputArray[i+1])) {
				// we find a decimal point but we already have one in the token we are considering
				if(currToken.includes('.') && inputArray[i+1] === '.'){
					throw new Error("Invalid Input");
				}
				currToken += inputArray[i+1];
				i++;
			}
			if(currToken.charAt(currToken.length-1) === '.'){
				throw new Error("Invalid Input");
			}
			tokenArray.push(currToken);
		}
	}
	return tokenArray;
}

/**
 * @param {array} tokenArray
 * @description looks for multiplication involving parentheses and adds * so that our postfix evaluator can understand it is a multiplication problem
 * @returns {array} token array where all parentheses multiplication problems have * inserted in proper positions e.g. x(y) => x*(y)
 */
 const fixParenthesesMultiplication = tokenArray => {
	for(let i = 1; i < tokenArray.length - 1; i++) {
		// case like (8)(8) should evaluate to (8)*(8) 
		if(tokenArray[i] === ')' && tokenArray[i+1] === '('){
			tokenArray.splice(i+1, 0, '*');
		}
		// case x(y-z) should evaluate to x*(y-z)
		else if(tokenArray[i] === '(' && isNumber(tokenArray[i-1])){
			tokenArray.splice(i, 0, '*')
			i++;
		}
		// case (y-z)x should evaluate to (y-z)*x
		else if(tokenArray[i] === ')' && isNumber(tokenArray[i+1])){
			tokenArray.splice(i+1, 0, '*');
		}
	}
	return tokenArray;
}

/**
 * @param {array} tokenArray 
 * @definition takes in array (in infix notation) and makes interactions with negative numbers easier to deal with for postfix algorithm
 * @returns {array} tokenArray where every negative number is in one index e.g. [-4] instead of [-, 4]
 */
 const fixNegativeNumbers = tokenArray => {
	for(let i = 0; i < tokenArray.length; i++) {
		// case like x + -(y + z) -> x + -1*(y+z)
		if(tokenArray[i] === '-' && tokenArray[i+1] === '(') {
			tokenArray[i] = '-1';
			tokenArray.splice(i+1, 0, '*')
			// if we had x - (y + z), we would go x -1*(y+z) so we need to add a + to get x + -1*(y+z)
			if(isNumber(tokenArray[i-1])) {
				tokenArray.splice(i, 0, '+')
				i++;
			}
		}
		else if(tokenArray[i] === '-' && isNumber(tokenArray[i+1])) {
			// we make it a string to keep our types consistent in the tokenArray
			tokenArray[i+1] = String(-1 * tokenArray[i+1]);
			tokenArray.splice(i, 1);
			// for case where we have x-y, we translate to x + -1*y or case where expression is (x + y) - z should be evaluated (x+y) + -1*z
			if(isNumber(tokenArray[i-1]) || tokenArray[i-1] === ')'){
				tokenArray.splice(i, 0, '+')
			}
		}
	}
	return tokenArray;
}

/**
 * @param {string} input 
 * @description takes in input and outputs array of tokens in postfix order
 * algorithm: https://runestone.academy/runestone/books/published/pythonds/BasicDS/InfixPrefixandPostfixExpressions.html
 * @returns {array} array of elements of input in postfix notation
 */
 const convertToPostfix = input => {
	const precedence = {
		'(': 1,
		'+': 2,
		'-': 2,
		'*': 3,
		'/': 3
	};

	const peek = stack => stack[stack.length - 1];
	const tokenArray = fixNegativeNumbers(fixParenthesesMultiplication(getArrayOfTokens(input)));
	const postfixArray = [];
	const operatorStack = [];

	for(token of tokenArray){
		if(!isOperator(token)){
			postfixArray.push(token);
		}
		else if(token === '('){
			operatorStack.push(token);
		}
		//find end of expression inside parantheses so we evaluate that first by giving its operators precedence in the postfix array
		else if(token === ')'){
			let currToken = operatorStack.pop();
			while(currToken !== '(') {
				postfixArray.push(currToken);
				currToken = operatorStack.pop();
			}
		}
		else{
			//higher precedence operators get evaluated first so before we push an operator onto postfix, we check for higher precedence operators already in stack and push them first
			while(operatorStack.length !== 0 && precedence[peek(operatorStack)] >= precedence[token]) {
				postfixArray.push(operatorStack.pop());
			}
			operatorStack.push(token);
		}
	}
	while(operatorStack.length !== 0){
		postfixArray.push(operatorStack.pop());
	}
	return postfixArray;
}

/**
 * @param {string} input 
 * @description Takes in a string representing a mathematical equation and evaluates it using postfix arithmetic
 * @returns {number} 
 */
const evaluateExpression = input => {
	validateInput(input);
	const operate = {
		'+': (x, y) => Number(x) + Number(y), 
		'-': (x, y) => Number(y) - Number(x), 
		'*': (x, y) => Number(x) * Number(y),
		'/': (x, y) => {
			if(x === 0) {
				throw new Error("Can not divide by zero.")
			}
			return Number(y) / Number(x);
		}
	};
	const postfixArray = convertToPostfix(input);
	const postfixStack = [];
	for(let token of postfixArray){
		if(isOperator(token)){
			const operation = operate[token];
			const elementOne = postfixStack.pop();
			const elementTwo = postfixStack.pop();
			postfixStack.push(operation(elementOne, elementTwo));
		}
		else{
			postfixStack.push(token);
		}
	}
	// add Number wrapper because if expression has no operators, will return a string
	const roundedSolution = solution => Number(Math.round(solution * 10000) / 10000);
	const solution = roundedSolution(postfixStack[0]);

	if(postfixStack.length !== 1 || !isNumber(solution)){
		throw new Error("Invalid Input");
	}
	
	return solution;
}

// if we are in browser, can't use node.js module.exports so it throws an error which doesn't matter to us since this code is only imported in testing, this works around that
try{	
	module.exports = { evaluateExpression, getArrayOfTokens, convertToPostfix, fixParenthesesMultiplication, fixNegativeNumbers }
}
catch (err){};