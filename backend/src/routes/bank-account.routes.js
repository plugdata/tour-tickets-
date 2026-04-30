const express = require('express');
const prisma = require('../config/prisma');
const path = require('path');
const fs = require('fs').promises;

const router = express.Router();

// Note: File upload functionality requires multer package
// For now, we'll handle image URLs as text input

// GET all bank accounts (admin: ?all=true returns inactive too)
router.get('/', async (req, res) => {
  try {
    const showAll = req.query.all === 'true';
    const bankAccounts = await prisma.bankAccount.findMany({
      where: showAll ? {} : { isActive: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(bankAccounts);
  } catch (error) {
    console.error('Error fetching bank accounts:', error);
    res.status(500).json({ message: 'Failed to fetch bank accounts' });
  }
});

// GET bank account by ID
router.get('/:id', async (req, res) => {
  try {
    const bankAccount = await prisma.bankAccount.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    
    if (!bankAccount) {
      return res.status(404).json({ message: 'Bank account not found' });
    }
    
    res.json(bankAccount);
  } catch (error) {
    console.error('Error fetching bank account:', error);
    res.status(500).json({ message: 'Failed to fetch bank account' });
  }
});

// POST create new bank account
router.post('/', async (req, res) => {
  try {
    const { accountNo, accountName, bankName, branch, accountType, description, imageUrl, qrCodeUrl, bookbankUrl, isActive } = req.body;

    if (!accountNo || !accountName || !bankName) {
      return res.status(400).json({ message: 'Missing required fields: accountNo, accountName, bankName' });
    }

    const existingAccount = await prisma.bankAccount.findUnique({ where: { accountNo } });
    if (existingAccount) {
      return res.status(400).json({ message: 'Account number already exists' });
    }

    const bankAccount = await prisma.bankAccount.create({
      data: {
        accountNo,
        accountName,
        bankName,
        branch: branch || null,
        accountType: accountType || 'COMPANY',
        imageUrl: imageUrl || null,
        qrCodeUrl: qrCodeUrl || null,
        bookbankUrl: bookbankUrl || null,
        description: description || null,
        isActive: isActive !== undefined ? Boolean(isActive) : true
      }
    });

    res.status(201).json(bankAccount);
  } catch (error) {
    console.error('Error creating bank account:', error);
    res.status(500).json({ message: 'Failed to create bank account' });
  }
});

// PUT update bank account
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const { accountNo, accountName, bankName, branch, accountType, description, imageUrl, qrCodeUrl, bookbankUrl, isActive } = req.body;

    const existingAccount = await prisma.bankAccount.findUnique({ where: { id } });
    if (!existingAccount) {
      return res.status(404).json({ message: 'Bank account not found' });
    }

    if (accountNo && accountNo !== existingAccount.accountNo) {
      const conflictingAccount = await prisma.bankAccount.findUnique({ where: { accountNo } });
      if (conflictingAccount) {
        return res.status(400).json({ message: 'Account number already exists' });
      }
    }

    const updatedAccount = await prisma.bankAccount.update({
      where: { id },
      data: {
        ...(accountNo && { accountNo }),
        ...(accountName && { accountName }),
        ...(bankName && { bankName }),
        ...(branch !== undefined && { branch }),
        ...(accountType && { accountType }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(qrCodeUrl !== undefined && { qrCodeUrl }),
        ...(bookbankUrl !== undefined && { bookbankUrl }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) })
      }
    });
    
    res.json(updatedAccount);
  } catch (error) {
    console.error('Error updating bank account:', error);
    res.status(500).json({ message: 'Failed to update bank account' });
  }
});

// DELETE (soft delete) bank account
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const bankAccount = await prisma.bankAccount.findUnique({
      where: { id }
    });
    
    if (!bankAccount) {
      return res.status(404).json({ message: 'Bank account not found' });
    }
    
    await prisma.bankAccount.update({
      where: { id },
      data: { isActive: false }
    });
    
    res.json({ message: 'Bank account deleted successfully' });
  } catch (error) {
    console.error('Error deleting bank account:', error);
    res.status(500).json({ message: 'Failed to delete bank account' });
  }
});

module.exports = router;
