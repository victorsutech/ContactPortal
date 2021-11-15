import * as React from "react";
import { ethers } from "ethers";
import './App.css';
import abi from './utils/ContactPortal.json';

export default function App() {
	const [currentAccount, setCurrentAccount] = React.useState("");
	const [allContacts, setAllContacts] = React.useState([]);
	const contractAddress = "0x3649596B7c6905eCB63aD7E90315c1D15e45Ea6A";
	const contractABI = abi.abi;

	const getAllContacts = async () => {
    try {
			const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const ContactPortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        /*
         * Call the getAllWaves method from your Smart Contract
         */
        const contacts = await ContactPortalContract.getAllContacts();
        
				/*
         * We only need address, timestamp, and message in our UI so let's
         * pick those out
         */
				const ContactsCleaned = contacts.map(contact => {
        return {
          address: contact.waver,
          timestamp: new Date(contact.timestamp * 1000),
          message: contact.message,
        };
      });

      setAllContacts(ContactsCleaned);
    } else {
      console.log("Ethereum object doesn't exist!");
    }
  } catch (error) {
    console.log(error);
  }
};

/**
 * Listen in for emitter events!
 */
React.useState(() => {
  let ContactPortalContract;

  const onNewContact = (from, timestamp, message) => {
    console.log('new_contact', from, timestamp, message);
    setAllContacts(prevState => [
      ...prevState,
      {
        address: from,
        timestamp: new Date(timestamp * 1000),
        message: message,
      },
    ]);
  };

  if (window.ethereum) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    ContactPortalContract = new ethers.Contract(contractAddress, contractABI, signer);
    ContactPortalContract.on('new_contact', onNewContact);
  }

  return () => {
    if (ContactPortalContract) {
      ContactPortalContract.off('new_contact', onNewContact);
    }
  };
}, []);

	const checkIfWalletIsConnected = () => {
		const { ethereum } = window;
		if (!ethereum) {
			console.log("Make sure you have metamask!");
			return
		} else {
			console.log("We have the ethereum object", ethereum);
		}

		ethereum.request({ method: 'eth_accounts' })
			.then(accounts => {
				if (accounts.length !== 0) {
					const account = accounts[0];
					console.log("Found an authorized account: ", account);
					setCurrentAccount(account);
					getAllContacts();
				} else {
					console.log("No authorized user found");
				}
			})
	}
	const connectWallet = () => {
		const { ethereum } = window;
		if (!ethereum) {
			alert("Get Metamask!")
			return;
		}

		ethereum.request({ method: 'eth_requestAccounts' })
			.then(accounts => {
				console.log("Connected", accounts[0])
				setCurrentAccount(accounts[0])
			})
			.catch(err => console.log(err));
	}

	const contact = async () => {
		try {
			const { ethereum } = window;

			if (ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const ContactPortalContract = new ethers.Contract(contractAddress, contractABI, signer);

				let count = await ContactPortalContract.getTotalContacts();
				console.log("Retrieved total contacts...", count.toNumber());

				const contactTxn = await ContactPortalContract.contact(document.getElementById("message").value, { gasLimit: 300000 });
				console.log("Mining...", contactTxn.hash);
				await contactTxn.wait();
				console.log("Mined -- ", contactTxn.hash);

				count = await ContactPortalContract.getTotalContacts();
				console.log("Retrieved total contacts...", count.toNumber());

			} else {
				console.log("Ethereum object doesn't exist!");
			}
		} catch (error) {
			console.log(error)
		}
	}

	React.useState(() => {
		checkIfWalletIsConnected();
	}, [])

	return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">
					<span role="img" aria-label="Wave">👋</span> Hey there!
        </div>

        <div className="bio">
          Hi I'm Victor! Connect your MetaMask wallet and connect with me!
        </div>
				
				<button className="contactButton" onClick={contact}>
          Enter a message below then click here to send!
				</button>
				<textarea id="message" name="message" rows="8" cols="50" placeholder = "Please enter the message you want to send here! Every message has a 50% chance of winning some ethereum!">
				</textarea>

        {!currentAccount && (
          <button className="contactButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}

        {allContacts.map((contact, index) => {
          return (
            <div key={index} style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px", color: "black" }}>
              <div>Address: {contact.address}</div>
              <div>Time: {contact.timestamp.toString()}</div>
              <div>Message: {contact.message}</div>
            </div>)
        })}
				<div className = "background">
				</div>
      </div>
    </div>
  );
}