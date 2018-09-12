'use strict'

import 'mocha';
import * as chai from 'chai';
import * as Headlight from '../';

const expect = chai.expect;
//const jsonata = require('jsonata');

const _ServerURL = 'https://headlightqa.paviasystems.com/1.0';
const _UserName = 'jason';
const _Password = 'password123';

describe('Node API test', () => {
    var client = new Headlight.Client(_ServerURL);

    it('can get API', ()=>{
        var bidItemApi = client.API(Headlight.API.BidItemApi);
    });
    
    it('authenticate', async() => {
        var session = await client.Login(_UserName, _Password);

        expect(session).to.have.property('SessionID');
    });

    it('can perform API request which requires authentication', async() => {
        var userApi = client.API(Headlight.API.UserApi);
        var record = await userApi.read(1);

        expect(record.body.IDUser).to.eq(1);
    });
});
