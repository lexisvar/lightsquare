var Util={
	_BITWISE_TYPE: ~8,
	_BITWISE_COLOUR: 3,

	colourFromHalfmove: function(halfmove) {
		return (Util.getHalfmoveIndex(halfmove)===1?BLACK:WHITE);
	},

	getOppColour: function(colour) {
		return (colour===BLACK?WHITE:BLACK);
	},

	getOppGame: function(gameId) {
		return [1, 0][gameId];
	},

	fullmoveFromHalfmove: function(halfmove) {
		return Math.floor(halfmove/2)+1;
	},

	halfmoveFromFullmove: function(fullmove) {
		return (fullmove-1)*2;
	},

	getHalfmoveIndex: function(halfmove) {
		return halfmove%2;
	},

	fullmoveDotFromColour: function(colour) {
		var dots=[];

		dots[WHITE]=".";
		dots[BLACK]="...";

		return dots[colour];
	},

	getType: function(piece) {
		return piece&Util._BITWISE_TYPE;
	},

	getColour: function(piece) {
		return piece>>Util._BITWISE_COLOUR;
	},

	getPiece: function(type, colour) {
		return (colour<<Util._BITWISE_COLOUR)|type;
	},

	isOnBoard: function(square) {
		return (square>-1 && sq<64);
	},

	getSquareColour: function(square) {
		var coords=Util.coordsFromSquare(square);

		return (coords[X]%2===coords[Y]%2?BLACK:WHITE);
	},

	getRelativeSquare: function(square, colour) {
		return (colour===BLACK?63-square:square);
	},

	xFromSquare: function(square) {
		return (square%8);
	},

	yFromSquare: function(square) {
		return ((square-Util.xFromSquare(square))/8);
	},

	fileFromSquare: function(square) {
		return FILES.charAt(Util.xFromSquare(square));
	},

	rankFromSquare: function(square) {
		return RANKS.charAt(Util.yFromSquare(square));
	},

	squareFromAlgebraic: function(algebraicSquare) {
		return Util.squareFromCoords([
			FILES.indexOf(algebraicSquare.charAt(X)),
			RANKS.indexOf(algebraicSquare.charAt(Y))
		]);
	},

	algebraicFromSquare: function(square) {
		return Util.fileFromSquare(square)+Util.rankFromSquare(square);
	},

	coordsFromSquare: function(square) {
		var x=square%8;
		var y=(square-x)/8;

		return [x, y];
	},

	squareFromCoords: function(coords) {
		return (coords[Y]*8)+coords[X];
	},

	squaresAreOnSameFile: function(squareA, squareB) {
		return Util.xFromSquare(squareA)===Util.xFromSquare(squareB);
	},

	squaresAreOnSameRank: function(squareA, squareB) {
		return Util.yFromSquare(squareA)===Util.yFromSquare(squareB);
	},

	isRegularMove: function(type, fromCoords, toCoords) {
		var diff=[
			Math.abs(fromCoords[X]-toCoords[X]),
			Math.abs(fromCoords[Y]-toCoords[Y])
		];

		if(diff[X]===0 && diff[Y]===0) {
			return false;
		}

		switch(type) {
			case PAWN: {
				return false;
			}

			case KNIGHT: {
				return ((diff[X]===2 && diff[Y]===1) || (diff[X]===1 && diff[Y]===2));
			}

			case BISHOP: {
				return (diff[X]===diff[Y]);
			}

			case ROOK: {
				return (diff[X]===0 || diff[Y]===0);
			}

			case QUEEN: {
				return (diff[X]===diff[Y] || (diff[X]===0 || diff[Y]===0));
			}

			case KING: {
				return ((diff[X]===1 || diff[X]===0) && (diff[Y]===1 || diff[Y]===0));
			}
		}
	},

	isPawnMove: function(relFrom, relTo) {
		return (relTo-relFrom===8);
	},

	isDoublePawnMove: function(relFrom, relTo) {
		return (relFrom>7 && relFrom<16 && relTo-relFrom===16);
	},

	isPawnCapture: function(relFrom , relTo) {
		var fromCoords=Util.coordsFromSquare(relFrom);
		var toCoords=Util.coordsFromSquare(relTo);

		return (toCoords[Y]-fromCoords[Y]===1 && Math.abs(toCoords[X]-fromCoords[X])===1);
	},

	isPawnPromotion: function(relTo) {
		return (relTo>55);
	},

	getEpPawn: function(capturerFrom, capturerTo) {
		return Util.squareFromCoords([Util.xFromSquare(capturerTo), Util.yFromSquare(capturerFrom)]);
	},

	getDiagonalDistance: function(fromCoords, toCoords) {
		return Math.abs(fromCoords[X]-toCoords[X]);
	},

	getSquaresBetween: function(from, to, inclusive) {
		var squares=[];

		var temp=from;

		from=Math.min(from, to);
		to=Math.max(temp, to);

		var fromCoords=Util.coordsFromSquare(from);
		var toCoords=Util.coordsFromSquare(to);

		var difference=to-from;
		var increment;

		if(inclusive) {
			squares.push(from);
		}

		if(Util.isRegularMove(BISHOP, fromCoords, toCoords)) {
			var distance=Util.getDiagonalDistance(fromCoords, toCoords);

			if(distance>0) {
				increment=difference/distance;

				for(var square=from+increment; square<to; square+=increment) {
					squares.push(square);
				}
			}
		}

		else if(Util.isRegularMove(ROOK, fromCoords, toCoords)) {
			if(difference>7) { //vertical move
				increment=8;
			}

			else { //horizontal move
				increment=1;
			}

			for(var square=from+increment; square<to; square+=increment) {
				squares.push(square);
			}
		}

		if(inclusive) {
			squares.push(to);
		}

		return squares;
	},

	isBlocked: function(board, from, to) {
		var squares=Util.getSquaresBetween(from, to);

		for(var i=0; i<squares.length; i++) {
			if(board[squares[i]]!==SQ_EMPTY) {
				return true;
			}
		}

		return false;
	},

	/*
	get a list of squares reachable from "from" by a piece of type "type", including
	all pawn moves and castling, without taking into account any other information or
	rules such as not moving through other pieces, moving into check, capturing own
	pieces or any castling rules other than "moving the king two squares to the left
	or right".
	*/

	getReachableSquares: function(type, from, colour) {
		var fromCoords=Util.coordsFromSquare(from);
		var squares=[];

		switch(type) {
			case PAWN: {
				var relFrom=Util.getRelativeSquare(from, colour);

				//double

				if(relFrom<16) {
					squares.push(Util.getRelativeSquare(relFrom+16, colour));
				}

				//single and captures

				var relCoords=Util.coordsFromSquare(relFrom);
				var x, y;

				for(var xDiff=-1; xDiff<2; xDiff++) {
					x=relCoords[X]+xDiff;
					y=relCoords[Y]+1;

					if(x>-1 && x<8 && y>-1 && y<8) {
						squares.push(Util.getRelativeSquare(Util.squareFromCoords([x, y]), colour));
					}
				}

				break;
			}

			case KNIGHT: {
				var xDiffs=[-1, -1, 1, 1, -2, -2, 2, 2];
				var yDiffs=[-2, 2, -2, 2, 1, -1, 1, -1];
				var x, y;

				for(var i=0; i<8; i++) {
					x=fromCoords[X]+xDiffs[i];
					y=fromCoords[Y]+yDiffs[i];

					if(x>-1 && x<8 && y>-1 && y<8) {
						squares.push(Util.squareFromCoords([x, y]));
					}
				}

				break;
			}

			case BISHOP: {
				var diffs=[1, -1];
				var coords;

				for(var ix=0; ix<diffs.length; ix++) {
					for(var iy=0; iy<diffs.length; iy++) {
						coords=[fromCoords[X], fromCoords[Y]];

						while(coords[X]>0 && coords[X]<7 && coords[Y]>0 && coords[Y]<7) {
							coords[X]+=diffs[ix];
							coords[Y]+=diffs[iy];

							squares.push(Util.squareFromCoords([coords[X], coords[Y]]));
						}
					}
				}

				break;
			}

			case ROOK: {
				var squareOnSameRank, squareOnSameFile;

				for(var n=0; n<8; n++) {
					squareOnSameRank=(fromCoords[Y]*8)+n;
					squareOnSameFile=fromCoords[X]+(n*8);

					if(squareOnSameRank!==from) {
						squares.push(squareOnSameRank);
					}

					if(squareOnSameFile!==from) {
						squares.push(squareOnSameFile);
					}
				}

				break;
			}

			case QUEEN: {
				var rookSquares=Util.getReachableSquares(ROOK, from, colour);
				var bishopSquares=Util.getReachableSquares(BISHOP, from, colour);

				squares=rookSquares.concat(bishopSquares);

				break;
			}

			case KING: {
				//regular king moves

				var x, y;

				for(var xDiff=-1; xDiff<2; xDiff++) {
					x=fromCoords[X]+xDiff;

					if(x>-1 && x<8) {
						for(var yDiff=-1; yDiff<2; yDiff++) {
							y=fromCoords[Y]+yDiff;

							if(y>-1 && y<8) {
								squares.push(Util.squareFromCoords([x, y]));
							}
						}
					}
				}

				//castling moves

				var xDiffs=[-2, 2];

				for(var i=0; i<xDiffs.length; i++) {
					x=fromCoords[X]+xDiffs[i];

					if(x>-1 && x<8) {
						squares.push(Util.squareFromCoords([x, fromCoords[Y]]));
					}
				}

				break;
			}
		}

		return squares;
	},

	getAttackers: function(board, type, square, colour) {
		/*
		king and pawn attacks are different to their normal moves (kings
		aren't attacking the squares they can castle to)
		*/

		if(type===PAWN) {
			return Util.getPawnAttackers(board, square, colour);
		}

		else if(type===KING) {
			return Util.getKingAttackers(board, square, colour);
		}

		/*
		the rest can all use getReachableSquares
		*/

		else {
			var attackers=[];
			var piece=Util.getPiece(type, colour);
			var candidateSquares=Util.getReachableSquares(type, square, colour);
			var candidateSquare;

			for(var i=0; i<candidateSquares.length; i++) {
				candidateSquare=candidateSquares[i];

				if(board[candidateSquare]===piece && !Util.isBlocked(board, square, candidateSquare)) {
					attackers.push(candidateSquare);
				}
			}

			return attackers;
		}
	},

	getPawnAttackers: function(board, square, colour) {
		var attackers=[];
		var piece=Util.getPiece(PAWN, colour);
		var playerColour=Util.getOppColour(colour);
		var relSquare=Util.getRelativeSquare(square, playerColour);
		var relCoords=Util.coordsFromSquare(relSquare);
		var xDiffs=[-1, 1];
		var xDiff;
		var x, y, candidateSquare;

		for(var i=0; i<xDiffs.length; i++) {
			xDiff=xDiffs[i];
			x=relCoords[X]+xDiff;
			y=relCoords[Y]+1;

			if(x>-1 && x<8 && y>-1 && y<8) {
				candidateSquare=Util.getRelativeSquare(Util.squareFromCoords([x, y]), playerColour);

				if(board[candidateSquare]===piece) {
					attackers.push(candidateSquare);
				}
			}
		}

		return attackers;
	},

	getKingAttackers: function(board, square, colour) {
		var attackers=[];
		var piece=Util.getPiece(KING, colour);
		var coords=Util.coordsFromSquare(square);
		var x, y, candidateSquare;

		for(var xDiff=-1; xDiff<2; xDiff++) {
			x=coords[X]+xDiff;

			if(x>-1 && x<8) {
				for(var yDiff=-1; yDiff<2; yDiff++) {
					y=coords[Y]+yDiff;

					if(y>-1 && y<8) {
						candidateSquare=Util.squareFromCoords([x, y]);

						if(board[candidateSquare]===piece) {
							attackers.push(candidateSquare);
						}
					}
				}
			}
		}

		return attackers;
	},

	getAllAttackers: function(board, square, colour) {
		var attackers=[];
		var pieceTypes=[PAWN, KNIGHT, BISHOP, ROOK, QUEEN, KING];

		for(var i=0; i<pieceTypes.length; i++) {
			attackers=attackers.concat(Util.getAttackers(board, pieceTypes[i], square, colour));
		}

		return attackers;
	},

	disambiguate: function(board, type, colour, from, to) {
		var disambiguationString="";
		var piecesInRange=Util.getAttackers(board, type, to, colour);

		var disambiguation={
			file: "",
			rank: ""
		};

		var square;

		for(var i=0; i<piecesInRange.length; i++) {
			square=piecesInRange[i];

			if(square!==from) {
				if(Util.xFromSquare(square)===Util.xFromSquare(from)) {
					disambiguation.file=Util.fileFromSquare(from);
				}

				if(Util.yFromSquare(square)===Util.yFromSquare(from)) {
					disambiguation.rank=Util.rankFromSquare(from);
				}
			}
		}

		disambiguationString=disambiguation.file+disambiguation.rank;

		//if neither rank nor file is the same, specify file

		if(piecesInRange.length>1 && disambiguationString==="") {
			disambiguationString=Util.fileFromSquare(from);
		}

		return disambiguationString;
	},

	elo: function(p, o, s) {
		return Math.round((p+(((p>-1 && p<2100)?32:((p>2099 && p<2400)?24:16))*(s-(1/(1+(Math.pow(10, ((o-p)/400)))))))));
	}
};